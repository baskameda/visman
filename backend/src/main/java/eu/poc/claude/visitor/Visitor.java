package eu.poc.claude.visitor;

public class Visitor {

    private Long    id;
    private String  firstName;
    private String  lastName;
    private String  company;
    private String  function;
    private String  email;
    private String  phone;
    private String  description;
    private String  createdBy;
    private boolean blacklisted;

    public Visitor() {}

    public Long    getId()             { return id; }
    public void    setId(Long id)      { this.id = id; }

    public String  getFirstName()      { return firstName; }
    public void    setFirstName(String v) { this.firstName = v; }

    public String  getLastName()       { return lastName; }
    public void    setLastName(String v) { this.lastName = v; }

    public String  getCompany()        { return company; }
    public void    setCompany(String v) { this.company = v; }

    public String  getFunction()       { return function; }
    public void    setFunction(String v) { this.function = v; }

    public String  getEmail()          { return email; }
    public void    setEmail(String v)  { this.email = v; }

    public String  getPhone()          { return phone; }
    public void    setPhone(String v)  { this.phone = v; }

    public String  getDescription()    { return description; }
    public void    setDescription(String v) { this.description = v; }

    public String  getCreatedBy()      { return createdBy; }
    public void    setCreatedBy(String v) { this.createdBy = v; }

    public boolean isBlacklisted()     { return blacklisted; }
    public void    setBlacklisted(boolean v) { this.blacklisted = v; }
}
