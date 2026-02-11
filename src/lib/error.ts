/**
 * 에러 객체에서 메시지를 안전하게 추출하는 유틸리티
 * catch (error: unknown) 패턴에서 사용
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
}
