-- ============================================
-- 가디언즈(Guardians) 시스템 스키마 마이그레이션
-- 생성일: 2026-03-04
-- 내용:
--   1. profiles 테이블에 고유 API 키 컬럼 추가
--   2. guardians 신규 테이블 생성 및 RLS 설정
--   3. death_certificates 스토리지 버킷 생성
--   4. vault_items 테이블 간소화 (수신인/PIN 컬럼 선택 처리)
-- ============================================

-- ============================================
-- 1. profiles 테이블에 api_key 컬럼 추가
-- ============================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles(api_key) WHERE api_key IS NOT NULL;

-- ============================================
-- 2. guardians 신규 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  sms_sent BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'opened')),
  death_certificate_path TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON guardians(user_id);

ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "유저는 자신의 가디언즈 목록만 조회 가능"
  ON guardians FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "유저는 자신의 가디언즈만 등록 가능"
  ON guardians FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "유저는 자신의 가디언즈만 수정 가능"
  ON guardians FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "유저는 자신의 가디언즈만 삭제 가능"
  ON guardians FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_guardians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW
  EXECUTE FUNCTION update_guardians_updated_at();

-- ============================================
-- 3. vault_items 테이블 간소화
-- ============================================
ALTER TABLE vault_items
  ALTER COLUMN account_id DROP NOT NULL,
  ALTER COLUMN password_encrypted DROP NOT NULL,
  ALTER COLUMN request_type DROP NOT NULL;

ALTER TABLE vault_items
  ADD COLUMN IF NOT EXISTS username TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_plain TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_legacy_scan BOOLEAN DEFAULT FALSE;

-- ============================================
-- 4. 스토리지 버킷: death_certificates
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'death_certificates',
  'death_certificates',
  FALSE,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anyone can upload death cert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'death_certificates');

CREATE POLICY "service role can view death certs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'death_certificates');
