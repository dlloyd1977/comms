// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSPASassClientAuthenticated as createSPASassClient } from '@/lib/supabase/client';


type User = {
    email: string;
    id: string;
    registered_at: Date;
    first_name?: string | null;
    nickname?: string | null;
    display_name?: string | null;
};

interface GlobalContextType {
    loading: boolean;
    user: User | null;  // Add this
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);  // Add this

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = await createSPASassClient();
                const client = supabase.getSupabaseClient();

                // Get user data
                const { data: { user } } = await client.auth.getUser();
                if (user) {
                    const email = user.email!;
                    let displayName = (user.user_metadata?.nickname || "").trim()
                        || (user.user_metadata?.first_name || "").trim()
                        || email;
                    let firstName: string | null = user.user_metadata?.first_name ?? null;
                    let nickname: string | null = user.user_metadata?.nickname ?? null;

                    try {
                        const { data: profileData } = await client
                            .from("active_members")
                            .select("nickname, first_name")
                            .eq("email", email)
                            .maybeSingle();
                        if (profileData?.nickname) {
                            nickname = profileData.nickname;
                        }
                        if (profileData?.first_name) {
                            firstName = profileData.first_name;
                        }
                        displayName = (nickname || "").trim()
                            || (firstName || "").trim()
                            || email;
                    } catch (error) {
                        console.warn("Profile lookup failed:", error);
                    }

                    setUser({
                        email,
                        id: user.id,
                        registered_at: new Date(user.created_at),
                        first_name: firstName,
                        nickname,
                        display_name: displayName,
                    });
                } else {
                    throw new Error('User not found');
                }

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    return (
        <GlobalContext.Provider value={{ loading, user }}>
            {children}
        </GlobalContext.Provider>
    );
}

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};