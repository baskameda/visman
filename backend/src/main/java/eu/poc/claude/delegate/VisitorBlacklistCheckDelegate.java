package eu.poc.claude.delegate;

import eu.poc.claude.invitation.SecurityCheckRepository;
import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once per multi-instance subprocess instance (one per visitor in an invitation).
 *
 * Reads:   visitorId   (local — from multi-instance collection)
 *          invitationId (process level)
 *
 * Writes:  blacklisted          (local boolean)
 *          currentSecurityCheckId (local Long  — looked up from DB)
 */
@Component("visitorBlacklistCheckDelegate")
public class VisitorBlacklistCheckDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(VisitorBlacklistCheckDelegate.class);

    private final JdbcTemplate            jdbc;
    private final SecurityCheckRepository securityCheckRepo;

    public VisitorBlacklistCheckDelegate(JdbcTemplate jdbc,
                                         SecurityCheckRepository securityCheckRepo) {
        this.jdbc              = jdbc;
        this.securityCheckRepo = securityCheckRepo;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long visitorId    = toLong(execution.getVariable("visitorId"));
        Long invitationId = toLong(execution.getVariable("invitationId"));

        // Check blacklist in DB
        Boolean blacklisted = jdbc.queryForObject(
            "SELECT blacklisted FROM poc_visitor WHERE id = ?",
            Boolean.class, visitorId);
        boolean isBlacklisted = Boolean.TRUE.equals(blacklisted);

        execution.setVariableLocal("blacklisted", isBlacklisted);

        // Look up the security check created by InvitationController
        Long scId = securityCheckRepo.findIdByInvitationAndVisitor(invitationId, visitorId);
        execution.setVariableLocal("currentSecurityCheckId", scId);

        log.info("[BlacklistCheck] visitor={} invitation={} blacklisted={} scId={}",
                 visitorId, invitationId, isBlacklisted, scId);
    }

    private static Long toLong(Object v) {
        if (v == null)             return null;
        if (v instanceof Long l)   return l;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
