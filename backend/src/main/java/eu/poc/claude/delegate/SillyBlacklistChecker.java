package eu.poc.claude.delegate;

import eu.poc.claude.visitor.VisitorRepository;
import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * BlacklistChecker – checks the poc_visitor registry for a blacklist flag.
 *
 * Sets process variables:
 *   - {@code blacklisted} (Boolean) – used by Gateway_17pwrkf condition
 *   - {@code reliability} (Long)    – kept for stats/history compatibility
 */
@Component("sillyBlacklistChecker")
public class SillyBlacklistChecker implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(SillyBlacklistChecker.class);

    private final VisitorRepository visitorRepository;

    public SillyBlacklistChecker(VisitorRepository visitorRepository) {
        this.visitorRepository = visitorRepository;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Object rawId    = execution.getVariable("visitorId");
        String firstName = (String) execution.getVariable("VFirstName");
        String lastName  = (String) execution.getVariable("VLastName");
        String visitorName = (firstName != null ? firstName : "") +
                             (lastName  != null ? " " + lastName : "");
        visitorName = visitorName.isBlank()
            ? (String) execution.getVariable("VName")
            : visitorName.trim();

        boolean blacklisted = false;

        if (rawId != null) {
            long visitorId = ((Number) rawId).longValue();
            blacklisted = visitorRepository.findById(visitorId)
                .map(v -> v.isBlacklisted())
                .orElse(false);

            if (blacklisted) {
                log.warn("[BlacklistChecker] Visitor '{}' (id={}) is BLACKLISTED — auto-refusing.",
                         visitorName, visitorId);
            } else {
                log.info("[BlacklistChecker] Visitor '{}' (id={}) not blacklisted — forwarding to Security.",
                         visitorName, visitorId);
            }
        } else {
            log.info("[BlacklistChecker] No visitorId set for '{}' — not blacklisted by default.", visitorName);
        }

        // Primary: boolean used by gateway condition ${blacklisted == true}
        execution.setVariable("blacklisted", blacklisted);
        // Compat: reliability kept for history/stats queries
        execution.setVariable("reliability", blacklisted ? 0L : 70L);
    }
}
