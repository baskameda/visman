package eu.poc.claude.invitation;

import eu.poc.claude.entrance.EntranceRepository;
import eu.poc.claude.visitor.Visitor;
import eu.poc.claude.visitor.VisitorRepository;
import org.operaton.bpm.engine.IdentityService;
import org.operaton.bpm.engine.RuntimeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationRepository    invitationRepo;
    private final SecurityCheckRepository securityCheckRepo;
    private final VisitRepository         visitRepo;
    private final VisitorRepository       visitorRepo;
    private final EntranceRepository      entranceRepo;
    private final RuntimeService          runtimeService;
    private final IdentityService         identityService;

    public InvitationController(InvitationRepository invitationRepo,
                                 SecurityCheckRepository securityCheckRepo,
                                 VisitRepository visitRepo,
                                 VisitorRepository visitorRepo,
                                 EntranceRepository entranceRepo,
                                 RuntimeService runtimeService,
                                 IdentityService identityService) {
        this.invitationRepo    = invitationRepo;
        this.securityCheckRepo = securityCheckRepo;
        this.visitRepo         = visitRepo;
        this.visitorRepo       = visitorRepo;
        this.entranceRepo      = entranceRepo;
        this.runtimeService    = runtimeService;
        this.identityService   = identityService;
    }

    // ── POST /api/invitations ─────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Invitation> create(
            @RequestBody InvitationRequest req,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String inviter = requireUsername(authHeader);

        // Validate dates
        LocalDate start = req.getStartDate();
        LocalDate end   = req.getEndDate();
        if (start == null || end == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate and endDate are required");
        if (end.isBefore(start))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate must be >= startDate");
        long days = ChronoUnit.DAYS.between(start, end) + 1;

        // Validate entrance
        if (req.getEntranceId() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "entranceId is required");
        entranceRepo.findById(req.getEntranceId()).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Entrance " + req.getEntranceId() + " not found"));

        // Validate visitors list
        if (req.getVisitors() == null || req.getVisitors().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one visitor is required");

        // Resolve visitors — create new ones as needed
        List<Long> visitorIds = new ArrayList<>();
        for (InvitationRequest.VisitorRef vref : req.getVisitors()) {
            if (vref.getId() != null) {
                visitorIds.add(vref.getId());
            } else {
                Visitor nv = new Visitor();
                nv.setFirstName(  vref.getFirstName());
                nv.setLastName(   vref.getLastName());
                nv.setCompany(    vref.getCompany());
                nv.setFunction(   vref.getFunction());
                nv.setEmail(      vref.getEmail());
                nv.setPhone(      vref.getPhone());
                nv.setDescription(vref.getDescription());
                visitorIds.add(visitorRepo.save(nv, inviter).getId());
            }
        }
        List<Long> unique = new ArrayList<>(new LinkedHashSet<>(visitorIds));

        // Capacity check
        long capacity = unique.size() * days;
        if (capacity > 50)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                unique.size() + " visitors × " + days + " days = " + capacity +
                " exceeds the maximum of 50 visits per invitation");

        // Blacklist check
        for (Long vid : unique) {
            Visitor v = visitorRepo.findById(vid).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visitor " + vid + " not found"));
            if (v.isBlacklisted())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Visitor " + v.getFirstName() + " " + v.getLastName() + " is blacklisted");
        }

        // Persist
        Invitation inv = new Invitation();
        inv.setInviterUsername(inviter);
        inv.setStartDate(start);
        inv.setEndDate(end);
        inv.setEntranceId(req.getEntranceId());
        inv.setCompany(req.getCompany());
        inv.setDescription(req.getDescription());
        invitationRepo.save(inv);

        for (Long vid : unique) invitationRepo.addVisitor(inv.getId(), vid);

        // Create security checks and assign via least-loaded distribution
        List<SecurityCheck> newChecks = new ArrayList<>();
        for (Long vid : unique) newChecks.add(securityCheckRepo.save(inv.getId(), vid));
        assignLeastLoaded(newChecks);

        // Start BPMN process
        Map<String, Object> vars = new HashMap<>();
        vars.put("starter",      inviter);
        vars.put("invitationId", inv.getId());
        vars.put("visitorIds",   unique);
        vars.put("entranceId",   req.getEntranceId());

        var instance = runtimeService.startProcessInstanceByKey("VisitProcess_2.0", vars);
        invitationRepo.setProcessInstanceId(inv.getId(), instance.getId());
        inv.setProcessInstanceId(instance.getId());
        inv.setStatus("PENDING");

        return ResponseEntity.status(HttpStatus.CREATED).body(inv);
    }

    // ── GET /api/invitations/my ───────────────────────────────────────────────

    @GetMapping("/my")
    public List<Invitation> myInvitations(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return invitationRepo.findByInviter(requireUsername(authHeader));
    }

    // ── GET /api/invitations/{id} ─────────────────────────────────────────────

    @GetMapping("/{id}")
    public Invitation getById(
            @PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        requireUsername(authHeader);
        Invitation inv = invitationRepo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation " + id + " not found"));

        List<SecurityCheck> checks = securityCheckRepo.findByInvitation(id);
        List<Invitation.InvitationVisitorDetail> details = new ArrayList<>();
        for (SecurityCheck sc : checks) {
            Invitation.InvitationVisitorDetail d = new Invitation.InvitationVisitorDetail();
            d.setVisitorId(           sc.getVisitorId());
            d.setFirstName(           sc.getVisitorFirstName());
            d.setLastName(            sc.getVisitorLastName());
            d.setCompany(             sc.getVisitorCompany());
            d.setSecurityCheckId(     sc.getId());
            d.setSecurityCheckStatus( sc.getStatus());
            d.setReliability(         sc.getReliability());
            d.setVisits(visitRepo.findBySecurityCheck(sc.getId()).stream().map(v -> {
                Invitation.VisitSummary s = new Invitation.VisitSummary();
                s.setId(v.getId()); s.setVisitDate(v.getVisitDate().toString()); s.setStatus(v.getStatus());
                return s;
            }).toList());
            details.add(d);
        }
        inv.setVisitors(details);
        inv.setStatus(computeStatus(checks));
        return inv;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assignLeastLoaded(List<SecurityCheck> checks) {
        if (checks.isEmpty()) return;
        List<org.operaton.bpm.engine.identity.User> members =
            identityService.createUserQuery().memberOfGroup("Security").list();
        if (members.isEmpty()) return;

        // Sort by current pending load ascending
        List<String> officers = members.stream()
            .map(org.operaton.bpm.engine.identity.User::getId)
            .sorted(java.util.Comparator.comparingInt(securityCheckRepo::countPendingForOfficer))
            .collect(java.util.stream.Collectors.toList());

        for (int i = 0; i < checks.size(); i++) {
            String assignee = officers.get(i % officers.size());
            securityCheckRepo.setAssignedTo(checks.get(i).getId(), assignee);
        }
    }

    private static String computeStatus(List<SecurityCheck> checks) {
        if (checks.isEmpty()) return "PENDING";
        long pending  = checks.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
        long approved = checks.stream().filter(c -> "APPROVED".equals(c.getStatus())).count();
        long refused  = checks.stream()
                              .filter(c -> "REFUSED".equals(c.getStatus()) || "BLACKLISTED".equals(c.getStatus()))
                              .count();
        if (pending  == checks.size()) return "PENDING";
        if (approved == checks.size()) return "APPROVED";
        if (refused  == checks.size()) return "REFUSED";
        return "IN_REVIEW";
    }

    private String requireUsername(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Basic "))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        try {
            String decoded = new String(Base64.getDecoder().decode(authHeader.substring(6)));
            String[] parts = decoded.split(":", 2);
            if (parts.length >= 1 && !parts[0].isBlank()) return parts[0];
        } catch (IllegalArgumentException ignored) {}
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}
