package eu.poc.claude.delegate;

import eu.poc.claude.invitation.SecurityCheckRepository;
import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Marks the current visitor's SecurityCheck as REFUSED or BLACKLISTED.
 * On BLACKLIST also sets poc_visitor.blacklisted = true.
 *
 * Reads: currentSecurityCheckId (local)
 *        securityDecision       (local — REFUSE | BLACKLIST)
 *        visitorId              (local)
 */
@Component("securityCheckRefusalDelegate")
public class SecurityCheckRefusalDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(SecurityCheckRefusalDelegate.class);

    private final SecurityCheckRepository securityCheckRepo;
    private final JdbcTemplate            jdbc;

    public SecurityCheckRefusalDelegate(SecurityCheckRepository securityCheckRepo,
                                        JdbcTemplate jdbc) {
        this.securityCheckRepo = securityCheckRepo;
        this.jdbc              = jdbc;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long   scId     = toLong(execution.getVariable("currentSecurityCheckId"));
        String decision = (String) execution.getVariable("securityDecision");
        Long   visitorId = toLong(execution.getVariable("visitorId"));

        // Default to REFUSED when called from the auto-refuse path (max clarifications)
        String status = "BLACKLIST".equalsIgnoreCase(decision) ? "BLACKLISTED" : "REFUSED";

        if (scId != null) {
            securityCheckRepo.updateStatus(scId, status);
        }

        if ("BLACKLISTED".equals(status) && visitorId != null) {
            jdbc.update("UPDATE poc_visitor SET blacklisted = 1 WHERE id = ?", visitorId);
            log.info("[Refusal] visitor={} BLACKLISTED", visitorId);
        }

        log.info("[Refusal] scId={} status={}", scId, status);
    }

    private static Long toLong(Object v) {
        if (v == null)             return null;
        if (v instanceof Long l)   return l;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
