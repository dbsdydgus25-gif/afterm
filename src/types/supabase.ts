export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            memorial_spaces: {
                Row: {
                    id: string
                    owner_id: string
                    title: string
                    description: string | null
                    theme: Json | null
                    is_public: boolean | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    owner_id: string
                    title: string
                    description?: string | null
                    theme?: Json | null
                    is_public?: boolean | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    owner_id?: string
                    title?: string
                    description?: string | null
                    theme?: Json | null
                    is_public?: boolean | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "memorial_spaces_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            space_members: {
                Row: {
                    id: string
                    space_id: string
                    user_id: string
                    role: 'host' | 'member' | 'viewer'
                    nickname: string | null
                    status: 'active' | 'banned' | 'left'
                    joined_at: string
                }
                Insert: {
                    id?: string
                    space_id: string
                    user_id: string
                    role: 'host' | 'member' | 'viewer'
                    nickname?: string | null
                    status?: 'active' | 'banned' | 'left'
                    joined_at?: string
                }
                Update: {
                    id?: string
                    space_id?: string
                    user_id?: string
                    role?: 'host' | 'member' | 'viewer'
                    nickname?: string | null
                    status?: 'active' | 'banned' | 'left'
                    joined_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "space_members_space_id_fkey"
                        columns: ["space_id"]
                        referencedRelation: "memorial_spaces"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "space_members_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            invitations: {
                Row: {
                    id: string
                    space_id: string
                    inviter_id: string | null
                    email: string | null
                    token: string
                    role: string
                    status: 'pending' | 'accepted' | 'expired'
                    expires_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    space_id: string
                    inviter_id?: string | null
                    email?: string | null
                    token: string
                    role?: string
                    status?: 'pending' | 'accepted' | 'expired'
                    expires_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    space_id?: string
                    inviter_id?: string | null
                    email?: string | null
                    token?: string
                    role?: string
                    status?: 'pending' | 'accepted' | 'expired'
                    expires_at?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "invitations_space_id_fkey"
                        columns: ["space_id"]
                        referencedRelation: "memorial_spaces"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invitations_inviter_id_fkey"
                        columns: ["inviter_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
