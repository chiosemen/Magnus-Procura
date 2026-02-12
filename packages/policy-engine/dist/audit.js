export const persistPolicyEvaluation = async (db, args) => {
    await db.query(`INSERT INTO policy_evaluations (entity_id, rule_id, result, reasons, metadata, evaluated_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::timestamptz)`, [args.entityId, args.ruleId, args.result, JSON.stringify(args.reasons), JSON.stringify(args.metadata), args.evaluatedAt]);
};
export const persistPolicyReport = async (db, report) => {
    for (const r of report.results) {
        await persistPolicyEvaluation(db, {
            entityId: report.entityId,
            ruleId: r.ruleId,
            result: r.result.status,
            reasons: r.result.reasons,
            metadata: r.result.metadata,
            evaluatedAt: r.result.timestamp
        });
    }
};
