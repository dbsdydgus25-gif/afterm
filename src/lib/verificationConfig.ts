export const VerificationConfig = {
    // Phase 1: 리포트 접수 후 ~ 1차 확인 메일 발송까지 대기 시간 (기본: 48시간)
    // 테스트: 0.02시간 ~= 1.2분
    DELAY_PHASE_1_HOURS: Number(process.env.VERIFY_DELAY_PHASE_1_HOURS) || 48,

    // Phase 2: 1차 메일 발송 후 ~ 2차(최종) 확인 메일 발송까지 대기 시간 (기본: 168시간 = 1주일)
    DELAY_PHASE_2_HOURS: Number(process.env.VERIFY_DELAY_PHASE_2_HOURS) || 168,

    // Final: 2차 메일 발송 후 ~ 잠금 해제까지 대기 시간 (기본: 24시간)
    DELAY_FINAL_HOURS: Number(process.env.VERIFY_DELAY_FINAL_HOURS) || 24,
};

export function getTargetTime(startTime: Date, hoursToAdd: number): Date {
    const target = new Date(startTime);
    target.setMinutes(target.getMinutes() + (hoursToAdd * 60));
    return target;
}
