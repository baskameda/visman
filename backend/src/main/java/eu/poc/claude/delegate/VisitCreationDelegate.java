package eu.poc.claude.delegate;

import eu.poc.claude.invitation.InvitationRepository;
import eu.poc.claude.invitation.SecurityCheckRepository;
import eu.poc.claude.invitation.VisitRepository;
import org.operaton.bpm.engine.delegate.DelegateExecution;
import org.operaton.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Creates one poc_visit row for each day in the invitation's date range
 * when security approves a visitor.
 *
 * Reads: currentSecurityCheckId (local)
 *        visitorId              (local)
 *        invitationId           (process)
 *        entranceId             (process)
 */
@Component("visitCreationDelegate")
public class VisitCreationDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(VisitCreationDelegate.class);

    private final InvitationRepository   invitationRepo;
    private final SecurityCheckRepository securityCheckRepo;
    private final VisitRepository         visitRepo;

    public VisitCreationDelegate(InvitationRepository invitationRepo,
                                  SecurityCheckRepository securityCheckRepo,
                                  VisitRepository visitRepo) {
        this.invitationRepo    = invitationRepo;
        this.securityCheckRepo = securityCheckRepo;
        this.visitRepo         = visitRepo;
    }

    @Override
    public void execute(DelegateExecution execution) {
        Long scId         = toLong(execution.getVariable("currentSecurityCheckId"));
        Long visitorId    = toLong(execution.getVariable("visitorId"));
        Long invitationId = toLong(execution.getVariable("invitationId"));
        Long entranceId   = toLong(execution.getVariable("entranceId"));

        // Mark security check as approved
        if (scId != null) {
            securityCheckRepo.updateStatus(scId, "APPROVED");
        }

        // Load date range from DB
        LocalDate[] range = invitationRepo.findDateRange(invitationId);
        LocalDate start   = range[0];
        LocalDate end     = range[1];

        // Create one visit per day
        int count = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            visitRepo.save(scId, visitorId, invitationId, d, entranceId);
            count++;
        }

        log.info("[VisitCreation] scId={} visitor={} invitation={} visits created={}",
                 scId, visitorId, invitationId, count);
    }

    private static Long toLong(Object v) {
        if (v == null)             return null;
        if (v instanceof Long l)   return l;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
