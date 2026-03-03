package eu.poc.claude.delegate;

import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Silly Blacklist Checker – a deliberately simple Java Delegate for the POC.
 *
 * Real-world implementation would call an external service or database.
 * Here we just set a default reliability score of 70 (visitor is NOT blacklisted)
 * so the process can proceed to the Security Check lane.
 *
 * The downstream gateways branch on:
 *   reliability <= 30  →  Invitation Refused
 *   reliability > 30   →  continue
 */
@Component("sillyBlacklistChecker")
public class SillyBlacklistChecker implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(SillyBlacklistChecker.class);

    @Override
    public void execute(DelegateExecution execution) {
        String visitorName = (String) execution.getVariable("VName");
        log.info("[BlacklistChecker] Checking visitor: '{}'", visitorName);

        // POC: everyone starts with a reliability of 70 (not blacklisted).
        // Security staff can lower this in the Security Check task.
        long reliability = 70L;
        execution.setVariable("reliability", reliability);

        log.info("[BlacklistChecker] Visitor '{}' passed blacklist check. reliability={}", visitorName, reliability);
    }
}
