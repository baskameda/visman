package eu.poc.claude.delegate;

import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Silly Check-In Service – a deliberately simple Java Delegate for the POC.
 *
 * Real-world implementation would update an access-control system, send a
 * notification, create a badge, etc.
 * Here we simply log the completed check-in details.
 */
@Component("sillyCheckinService")
public class SillyCheckinService implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(SillyCheckinService.class);

    @Override
    public void execute(DelegateExecution execution) {
        String visitorName  = (String) execution.getVariable("VName");
        Object plannedDate  = execution.getVariable("VDate");
        Object actualDate   = execution.getVariable("AVDate");
        Object reliability  = execution.getVariable("reliability");

        log.info("================================================");
        log.info("[CheckInService] VISITOR CHECKED IN");
        log.info("  Visitor      : {}", visitorName);
        log.info("  Planned date : {}", plannedDate);
        log.info("  Actual date  : {}", actualDate);
        log.info("  Reliability  : {}", reliability);
        log.info("  Process ID   : {}", execution.getProcessInstanceId());
        log.info("================================================");

        // Mark check-in as complete in process variables
        execution.setVariable("checkedIn", true);
    }
}
