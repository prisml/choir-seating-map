import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // 현재 세션 가져오기
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        // 인증 상태 변경 리스너
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
            });
        });

        return () => subscription.unsubscribe();
    }, []);

    // 회원가입
    const signUp = useCallback(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
        return data;
    }, []);

    // 로그인
    const signIn = useCallback(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    }, []);

    // 로그아웃
    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }, []);

    return {
        user: state.user,
        session: state.session,
        loading: state.loading,
        signUp,
        signIn,
        signOut,
    };
}
