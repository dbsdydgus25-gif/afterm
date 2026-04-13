/**
 * 에러 객체에서 메시지를 안전하게 추출하는 유틸리티
 * catch (error: unknown) 패턴에서 사용
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
}

/**
 * 에러 객체에서 스택 트레이스를 안전하게 추출하는 유틸리티
 * TypeScript에서 unknown 타입의 error.stack 접근 시 타입 에러를 방지하기 위해 사용
 */
export function getErrorStack(error: unknown): string | undefined {
    // Error 인스턴스일 경우에만 stack 접근 허용 (타입 가드)
    if (error instanceof Error) return error.stack;
    return undefined;
}
