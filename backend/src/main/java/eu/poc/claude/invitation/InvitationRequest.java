package eu.poc.claude.invitation;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

/** Request body for POST /api/invitations */
public class InvitationRequest {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private Long         entranceId;
    private String       company;
    private String       description;
    private List<VisitorRef> visitors;

    public LocalDate         getStartDate()  { return startDate; }
    public void              setStartDate(LocalDate v)   { this.startDate = v; }
    public LocalDate         getEndDate()    { return endDate; }
    public void              setEndDate(LocalDate v)     { this.endDate = v; }
    public Long              getEntranceId() { return entranceId; }
    public void              setEntranceId(Long v)       { this.entranceId = v; }
    public String            getCompany()    { return company; }
    public void              setCompany(String v)        { this.company = v; }
    public String            getDescription(){ return description; }
    public void              setDescription(String v)    { this.description = v; }
    public List<VisitorRef>  getVisitors()   { return visitors; }
    public void              setVisitors(List<VisitorRef> v) { this.visitors = v; }

    /** Either supply {id} for an existing visitor OR the full profile for a new one. */
    public static class VisitorRef {
        private Long   id;
        private String firstName;
        private String lastName;
        private String company;
        private String function;
        private String email;
        private String phone;
        private String description;

        public Long   getId()          { return id; }
        public void   setId(Long v)    { this.id = v; }
        public String getFirstName()   { return firstName; }
        public void   setFirstName(String v)  { this.firstName = v; }
        public String getLastName()    { return lastName; }
        public void   setLastName(String v)   { this.lastName = v; }
        public String getCompany()     { return company; }
        public void   setCompany(String v)    { this.company = v; }
        public String getFunction()    { return function; }
        public void   setFunction(String v)   { this.function = v; }
        public String getEmail()       { return email; }
        public void   setEmail(String v)      { this.email = v; }
        public String getPhone()       { return phone; }
        public void   setPhone(String v)      { this.phone = v; }
        public String getDescription() { return description; }
        public void   setDescription(String v){ this.description = v; }
    }
}
