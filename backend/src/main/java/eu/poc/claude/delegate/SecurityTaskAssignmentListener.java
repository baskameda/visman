package eu.poc.claude.delegate;

import org.operaton.bpm.engine.delegate.DelegateTask;
import org.operaton.bpm.engine.delegate.TaskListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Task listener that re-assigns the "Security Check" task back to the
 * specific security officer who requested clarification.
 *
 * Registered in the BPMN as:
 *   {@code <camunda:taskListener event="create"
 *      delegateExpression="${securityTaskAssignmentListener}" />}
 *
 * On first pass: {@code securityReviewer} is null → no assignment,
 *   task falls to candidateGroup "Security".
 * After clarification: {@code securityReviewer} is set → task is
 *   assigned directly to that officer.
 */
@Component("securityTaskAssignmentListener")
public class SecurityTaskAssignmentListener implements TaskListener {

    private static final Logger log = LoggerFactory.getLogger(SecurityTaskAssignmentListener.class);

    @Override
    public void notify(DelegateTask task) {
        Object raw = task.getVariable("securityReviewer");
        if (raw instanceof String reviewer && !reviewer.isBlank()) {
            task.setAssignee(reviewer);
            log.info("[SecurityTaskListener] Security Check task {} re-assigned to '{}'",
                     task.getId(), reviewer);
        }
    }
}
