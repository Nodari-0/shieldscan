// ==========================================
// DEVELOPER-FRIENDLY FIX ENGINE
// ==========================================
// Auto-generated security fixes for common vulnerabilities
// Shows vulnerable vs fixed code in multiple languages

export type SupportedLanguage = 'nodejs' | 'python' | 'java' | 'go';

export interface CodeExample {
  vulnerable: string;
  fixed: string;
  explanation: string;
}

export interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  cweId?: string;
  owaspCategory?: string;
  fixes: Partial<Record<SupportedLanguage, CodeExample>>;
  references: string[];
  quickFix?: string; // One-liner fix for simple cases
}

// ==========================================
// FIX SUGGESTIONS DATABASE
// ==========================================
export const FIX_SUGGESTIONS: Record<string, FixSuggestion> = {
  // ==========================================
  // XSS (Cross-Site Scripting)
  // ==========================================
  'xss': {
    id: 'xss',
    title: 'Cross-Site Scripting (XSS) Prevention',
    description: 'User input is reflected without proper encoding, allowing script injection.',
    severity: 'high',
    category: 'Injection',
    cweId: 'CWE-79',
    owaspCategory: 'A03:2021 – Injection',
    quickFix: 'Encode all user input before rendering in HTML context',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ VULNERABLE: Direct rendering of user input
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(\`<h1>Results for: \${query}</h1>\`);
});`,
        fixed: `// ✅ FIXED: Escape HTML entities
const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

app.get('/search', (req, res) => {
  const query = escapeHtml(req.query.q || '');
  res.send(\`<h1>Results for: \${query}</h1>\`);
});

// Or use a templating engine with auto-escaping (recommended)
// EJS, Pug, Handlebars all auto-escape by default`,
        explanation: 'Always escape user input before inserting into HTML. Use templating engines with auto-escaping enabled.',
      },
      python: {
        vulnerable: `# ❌ VULNERABLE: Direct string formatting
from flask import Flask, request

@app.route('/search')
def search():
    query = request.args.get('q', '')
    return f'<h1>Results for: {query}</h1>'`,
        fixed: `# ✅ FIXED: Use Markup.escape() or Jinja2 templates
from flask import Flask, request
from markupsafe import escape

@app.route('/search')
def search():
    query = escape(request.args.get('q', ''))
    return f'<h1>Results for: {query}</h1>'

# Or use Jinja2 templates (auto-escapes by default)
# return render_template('search.html', query=query)`,
        explanation: 'Use markupsafe.escape() or Jinja2 templates which auto-escape by default.',
      },
      java: {
        vulnerable: `// ❌ VULNERABLE: Direct concatenation
@GetMapping("/search")
public String search(@RequestParam String q) {
    return "<h1>Results for: " + q + "</h1>";
}`,
        fixed: `// ✅ FIXED: Use HtmlUtils.htmlEscape()
import org.springframework.web.util.HtmlUtils;

@GetMapping("/search")
public String search(@RequestParam String q) {
    String safeQuery = HtmlUtils.htmlEscape(q);
    return "<h1>Results for: " + safeQuery + "</h1>";
}

// Or use Thymeleaf templates (auto-escapes by default)
// th:text="\${query}" automatically escapes`,
        explanation: 'Use HtmlUtils.htmlEscape() or Thymeleaf templates with th:text for automatic escaping.',
      },
      go: {
        vulnerable: `// ❌ VULNERABLE: Direct string formatting
func searchHandler(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")
    fmt.Fprintf(w, "<h1>Results for: %s</h1>", query)
}`,
        fixed: `// ✅ FIXED: Use html/template package
import "html/template"

func searchHandler(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")
    tmpl := template.Must(template.New("search").Parse(
        "<h1>Results for: {{.}}</h1>"))
    tmpl.Execute(w, query)
}

// html/template auto-escapes contextually`,
        explanation: 'Use html/template package instead of text/template - it provides automatic contextual escaping.',
      },
    },
    references: [
      'https://owasp.org/www-community/attacks/xss/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
    ],
  },

  // ==========================================
  // SQL Injection
  // ==========================================
  'sqli': {
    id: 'sqli',
    title: 'SQL Injection Prevention',
    description: 'User input is concatenated into SQL queries, allowing database manipulation.',
    severity: 'critical',
    category: 'Injection',
    cweId: 'CWE-89',
    owaspCategory: 'A03:2021 – Injection',
    quickFix: 'Use parameterized queries / prepared statements',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ VULNERABLE: String concatenation in query
app.get('/user', async (req, res) => {
  const userId = req.query.id;
  const result = await db.query(
    \`SELECT * FROM users WHERE id = '\${userId}'\`
  );
  res.json(result);
});`,
        fixed: `// ✅ FIXED: Parameterized query
app.get('/user', async (req, res) => {
  const userId = req.query.id;
  const result = await db.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  res.json(result);
});

// Or use an ORM like Prisma/Sequelize
// const user = await prisma.user.findUnique({ where: { id } });`,
        explanation: 'Always use parameterized queries. ORMs like Prisma, Sequelize, or TypeORM handle this automatically.',
      },
      python: {
        vulnerable: `# ❌ VULNERABLE: f-string in query
@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    cursor.execute(f"SELECT * FROM users WHERE id = '{user_id}'")
    return jsonify(cursor.fetchone())`,
        fixed: `# ✅ FIXED: Parameterized query
@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    cursor.execute(
        "SELECT * FROM users WHERE id = %s",
        (user_id,)
    )
    return jsonify(cursor.fetchone())

# Or use SQLAlchemy ORM
# user = User.query.filter_by(id=user_id).first()`,
        explanation: 'Use parameterized queries with placeholders. SQLAlchemy ORM provides automatic protection.',
      },
      java: {
        vulnerable: `// ❌ VULNERABLE: String concatenation
String query = "SELECT * FROM users WHERE id = '" + userId + "'";
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(query);`,
        fixed: `// ✅ FIXED: PreparedStatement with parameters
String query = "SELECT * FROM users WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(query);
pstmt.setString(1, userId);
ResultSet rs = pstmt.executeQuery();

// Or use JPA/Hibernate
// User user = entityManager.find(User.class, userId);`,
        explanation: 'Always use PreparedStatement with parameter binding. JPA/Hibernate provide automatic protection.',
      },
      go: {
        vulnerable: `// ❌ VULNERABLE: fmt.Sprintf in query
func getUser(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")
    query := fmt.Sprintf("SELECT * FROM users WHERE id = '%s'", userID)
    rows, _ := db.Query(query)
}`,
        fixed: `// ✅ FIXED: Parameterized query
func getUser(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")
    rows, err := db.Query(
        "SELECT * FROM users WHERE id = $1",
        userID,
    )
    if err != nil {
        http.Error(w, "Database error", 500)
        return
    }
    defer rows.Close()
}

// Or use GORM
// db.First(&user, userID)`,
        explanation: 'Use parameterized queries with $1, $2 placeholders. GORM provides automatic SQL injection protection.',
      },
    },
    references: [
      'https://owasp.org/www-community/attacks/SQL_Injection',
      'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
    ],
  },

  // ==========================================
  // Missing HSTS
  // ==========================================
  'header-hsts': {
    id: 'header-hsts',
    title: 'HTTP Strict Transport Security (HSTS)',
    description: 'HSTS header is not set, allowing potential downgrade attacks.',
    severity: 'medium',
    category: 'Transport Security',
    cweId: 'CWE-319',
    owaspCategory: 'A02:2021 – Cryptographic Failures',
    quickFix: 'Add Strict-Transport-Security header with max-age',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ MISSING: No HSTS header
app.get('/', (req, res) => {
  res.send('Hello World');
});`,
        fixed: `// ✅ FIXED: Using helmet middleware
const helmet = require('helmet');

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));

// Or set header manually
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});`,
        explanation: 'Use helmet middleware for comprehensive security headers. Set max-age to at least 1 year for HSTS.',
      },
      python: {
        vulnerable: `# ❌ MISSING: No HSTS header
@app.route('/')
def index():
    return 'Hello World'`,
        fixed: `# ✅ FIXED: Using Flask-Talisman
from flask_talisman import Talisman

Talisman(app, 
    strict_transport_security=True,
    strict_transport_security_max_age=31536000,
    strict_transport_security_include_subdomains=True
)

# Or set header manually
@app.after_request
def add_security_headers(response):
    response.headers['Strict-Transport-Security'] = \\
        'max-age=31536000; includeSubDomains; preload'
    return response`,
        explanation: 'Use Flask-Talisman for comprehensive security headers or set headers in after_request hook.',
      },
      java: {
        vulnerable: `// ❌ MISSING: No HSTS configuration
@Configuration
public class SecurityConfig {
    // No headers configured
}`,
        fixed: `// ✅ FIXED: Spring Security headers
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) 
            throws Exception {
        http.headers(headers -> headers
            .httpStrictTransportSecurity(hsts -> hsts
                .maxAgeInSeconds(31536000)
                .includeSubDomains(true)
                .preload(true)
            )
        );
        return http.build();
    }
}`,
        explanation: 'Configure HSTS in Spring Security. Use maxAgeInSeconds of at least 31536000 (1 year).',
      },
      go: {
        vulnerable: `// ❌ MISSING: No HSTS header
func handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello World"))
}`,
        fixed: `// ✅ FIXED: Add HSTS header
func securityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Strict-Transport-Security", 
            "max-age=31536000; includeSubDomains; preload")
        next.ServeHTTP(w, r)
    })
}

// Use as middleware
http.Handle("/", securityHeaders(http.HandlerFunc(handler)))`,
        explanation: 'Create a middleware to add HSTS header to all responses. Consider using secure middleware packages.',
      },
    },
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
      'https://hstspreload.org/',
    ],
  },

  // ==========================================
  // Missing CSP
  // ==========================================
  'header-csp': {
    id: 'header-csp',
    title: 'Content Security Policy (CSP)',
    description: 'CSP header helps mitigate XSS attacks by controlling resource loading.',
    severity: 'low',
    category: 'Best Practice',
    cweId: 'CWE-1021',
    owaspCategory: 'A05:2021 – Security Misconfiguration',
    quickFix: 'Add Content-Security-Policy header with appropriate directives',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ MISSING: No CSP header
app.get('/', (req, res) => {
  res.send('<html>...</html>');
});`,
        fixed: `// ✅ FIXED: Using helmet middleware
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline if possible
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));`,
        explanation: 'Start with a restrictive policy and loosen as needed. Avoid unsafe-inline if possible.',
      },
      python: {
        vulnerable: `# ❌ MISSING: No CSP header
@app.route('/')
def index():
    return render_template('index.html')`,
        fixed: `# ✅ FIXED: Using Flask-Talisman
from flask_talisman import Talisman

csp = {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'object-src': "'none'",
    'frame-ancestors': "'none'"
}

Talisman(app, content_security_policy=csp)`,
        explanation: 'Flask-Talisman provides easy CSP configuration. Start restrictive and adjust based on app needs.',
      },
      java: {
        vulnerable: `// ❌ MISSING: No CSP configuration
// Default Spring Security without CSP`,
        fixed: `// ✅ FIXED: Spring Security CSP
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) 
            throws Exception {
        http.headers(headers -> headers
            .contentSecurityPolicy(csp -> csp
                .policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self'; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data: https:; " +
                    "object-src 'none'; " +
                    "frame-ancestors 'none'"
                )
            )
        );
        return http.build();
    }
}`,
        explanation: 'Configure CSP in Spring Security. Test thoroughly as CSP can break functionality.',
      },
      go: {
        vulnerable: `// ❌ MISSING: No CSP header
func handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("<html>...</html>"))
}`,
        fixed: `// ✅ FIXED: Add CSP header
func securityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Security-Policy", 
            "default-src 'self'; "+
            "script-src 'self'; "+
            "style-src 'self' 'unsafe-inline'; "+
            "img-src 'self' data: https:; "+
            "object-src 'none'; "+
            "frame-ancestors 'none'")
        next.ServeHTTP(w, r)
    })
}`,
        explanation: 'Add CSP via middleware. Consider using nonce-based CSP for inline scripts.',
      },
    },
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
      'https://csp-evaluator.withgoogle.com/',
    ],
  },

  // ==========================================
  // Missing X-Frame-Options
  // ==========================================
  'header-xfo': {
    id: 'header-xfo',
    title: 'X-Frame-Options (Clickjacking Protection)',
    description: 'X-Frame-Options header prevents your page from being embedded in iframes.',
    severity: 'medium',
    category: 'Headers',
    cweId: 'CWE-1021',
    owaspCategory: 'A05:2021 – Security Misconfiguration',
    quickFix: 'Add X-Frame-Options: DENY or SAMEORIGIN header',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ MISSING: No clickjacking protection
app.get('/', (req, res) => {
  res.send('<html>...</html>');
});`,
        fixed: `// ✅ FIXED: Using helmet middleware
const helmet = require('helmet');
app.use(helmet.frameguard({ action: 'deny' }));

// Or set header manually
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  // Or 'SAMEORIGIN' if you need to embed in same-origin frames
  next();
});`,
        explanation: 'Use DENY to block all framing, or SAMEORIGIN to allow same-origin framing only.',
      },
      python: {
        vulnerable: `# ❌ MISSING: No clickjacking protection
@app.route('/')
def index():
    return render_template('index.html')`,
        fixed: `# ✅ FIXED: Using Flask-Talisman
from flask_talisman import Talisman
Talisman(app, frame_options='DENY')

# Or manually
@app.after_request
def add_xfo(response):
    response.headers['X-Frame-Options'] = 'DENY'
    return response`,
        explanation: 'Flask-Talisman handles this by default. Use DENY for maximum protection.',
      },
      java: {
        vulnerable: `// ❌ MISSING: No X-Frame-Options
// Default configuration`,
        fixed: `// ✅ FIXED: Spring Security frame options
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) 
            throws Exception {
        http.headers(headers -> headers
            .frameOptions(frame -> frame.deny())
        );
        return http.build();
    }
}`,
        explanation: 'Spring Security provides frameOptions configuration. Use deny() for strictest protection.',
      },
      go: {
        vulnerable: `// ❌ MISSING: No X-Frame-Options
func handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("<html>...</html>"))
}`,
        fixed: `// ✅ FIXED: Add X-Frame-Options header
func securityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("X-Frame-Options", "DENY")
        next.ServeHTTP(w, r)
    })
}`,
        explanation: 'Add X-Frame-Options via middleware. DENY is the most secure option.',
      },
    },
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
      'https://owasp.org/www-community/attacks/Clickjacking',
    ],
  },

  // ==========================================
  // Cookie Security
  // ==========================================
  'cookie-security': {
    id: 'cookie-security',
    title: 'Cookie Security Flags',
    description: 'Cookies should have Secure, HttpOnly, and SameSite flags for protection.',
    severity: 'medium',
    category: 'Session Management',
    cweId: 'CWE-614',
    owaspCategory: 'A07:2021 – Identification and Authentication Failures',
    quickFix: 'Add Secure, HttpOnly, and SameSite flags to session cookies',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ VULNERABLE: Insecure cookie settings
app.use(session({
  secret: 'secret',
  cookie: {
    // No security flags
  }
}));`,
        fixed: `// ✅ FIXED: Secure cookie configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: '__Host-sessionId', // Use __Host- prefix for extra security
  cookie: {
    secure: true,        // Only send over HTTPS
    httpOnly: true,      // Not accessible via JavaScript
    sameSite: 'strict',  // Prevent CSRF
    maxAge: 3600000,     // 1 hour
    path: '/'
  },
  resave: false,
  saveUninitialized: false
}));`,
        explanation: 'Always use Secure (HTTPS only), HttpOnly (no JS access), and SameSite (CSRF protection) flags.',
      },
      python: {
        vulnerable: `# ❌ VULNERABLE: Default session config
app.config['SECRET_KEY'] = 'secret'
# No cookie security settings`,
        fixed: `# ✅ FIXED: Secure session configuration
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY'),
    SESSION_COOKIE_SECURE=True,      # HTTPS only
    SESSION_COOKIE_HTTPONLY=True,    # No JS access
    SESSION_COOKIE_SAMESITE='Strict', # CSRF protection
    SESSION_COOKIE_NAME='__Host-session',
    PERMANENT_SESSION_LIFETIME=timedelta(hours=1)
)`,
        explanation: 'Flask provides configuration options for all cookie security flags.',
      },
      java: {
        vulnerable: `// ❌ VULNERABLE: Default session cookie
// No explicit cookie configuration`,
        fixed: `// ✅ FIXED: application.properties
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.same-site=strict
server.servlet.session.cookie.name=__Host-JSESSIONID

// Or programmatically
@Bean
public CookieSerializer cookieSerializer() {
    DefaultCookieSerializer serializer = new DefaultCookieSerializer();
    serializer.setCookieName("__Host-SESSION");
    serializer.setUseSecureCookie(true);
    serializer.setUseHttpOnlyCookie(true);
    serializer.setSameSite("Strict");
    return serializer;
}`,
        explanation: 'Configure cookie security in application.properties or programmatically with CookieSerializer.',
      },
      go: {
        vulnerable: `// ❌ VULNERABLE: Insecure cookie
http.SetCookie(w, &http.Cookie{
    Name:  "session",
    Value: sessionID,
})`,
        fixed: `// ✅ FIXED: Secure cookie settings
http.SetCookie(w, &http.Cookie{
    Name:     "__Host-session",
    Value:    sessionID,
    Path:     "/",
    Secure:   true,       // HTTPS only
    HttpOnly: true,       // No JS access
    SameSite: http.SameSiteStrictMode, // CSRF protection
    MaxAge:   3600,       // 1 hour
})`,
        explanation: 'Set all security flags when creating cookies. Use __Host- prefix for additional security.',
      },
    },
    references: [
      'https://owasp.org/www-community/controls/SecureCookieAttribute',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies',
    ],
  },

  // ==========================================
  // Sensitive File Exposure
  // ==========================================
  'sensitive-files': {
    id: 'sensitive-files',
    title: 'Sensitive File Exposure Prevention',
    description: 'Sensitive files like .env, .git, backups are publicly accessible.',
    severity: 'high',
    category: 'Information Disclosure',
    cweId: 'CWE-538',
    owaspCategory: 'A01:2021 – Broken Access Control',
    quickFix: 'Block access to sensitive files in web server configuration',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ VULNERABLE: Serving entire directory
app.use(express.static('public'));
// .env, .git may be accessible`,
        fixed: `// ✅ FIXED: Explicit file serving with blacklist
const path = require('path');

// Block sensitive file patterns
app.use((req, res, next) => {
  const blocked = ['.env', '.git', '.htaccess', 'config.', 'backup'];
  if (blocked.some(b => req.path.toLowerCase().includes(b))) {
    return res.status(404).send('Not found');
  }
  next();
});

// Serve only specific directories
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));`,
        explanation: 'Never serve the root directory. Block sensitive file patterns explicitly.',
      },
      python: {
        vulnerable: `# ❌ VULNERABLE: Serving project root
# Misconfigured static file serving`,
        fixed: `# ✅ FIXED: Nginx configuration (recommended)
# nginx.conf
location ~ /\\. {
    deny all;
}
location ~ \\.(env|git|bak|sql|log)$ {
    deny all;
}

# Flask: Only serve specific static folder
app = Flask(__name__, static_folder='static', static_url_path='/static')`,
        explanation: 'Configure web server (Nginx/Apache) to block sensitive files. Never serve project root.',
      },
      java: {
        vulnerable: `// ❌ VULNERABLE: Misconfigured resource handling`,
        fixed: `// ✅ FIXED: Spring Security resource blocking
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) 
            throws Exception {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/.env", "/.git/**", "/*.bak").denyAll()
            .requestMatchers("/static/**", "/public/**").permitAll()
            .anyRequest().authenticated()
        );
        return http.build();
    }
}`,
        explanation: 'Use Spring Security to explicitly deny access to sensitive file patterns.',
      },
      go: {
        vulnerable: `// ❌ VULNERABLE: Serving entire directory
http.Handle("/", http.FileServer(http.Dir(".")))`,
        fixed: `// ✅ FIXED: Restricted file serving
func safeFileServer(dir string) http.Handler {
    fs := http.FileServer(http.Dir(dir))
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Block sensitive files
        blocked := []string{".env", ".git", ".htaccess", "config"}
        for _, b := range blocked {
            if strings.Contains(strings.ToLower(r.URL.Path), b) {
                http.NotFound(w, r)
                return
            }
        }
        fs.ServeHTTP(w, r)
    })
}

http.Handle("/static/", http.StripPrefix("/static/", 
    safeFileServer("./public")))`,
        explanation: 'Wrap file server with middleware that blocks sensitive file patterns.',
      },
    },
    references: [
      'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/04-Review_Old_Backup_and_Unreferenced_Files_for_Sensitive_Information',
    ],
  },

  // ==========================================
  // CORS Misconfiguration
  // ==========================================
  'cors-config': {
    id: 'cors-config',
    title: 'CORS Configuration',
    description: 'CORS allows all origins (*) which may expose sensitive data to malicious sites.',
    severity: 'medium',
    category: 'Headers',
    cweId: 'CWE-942',
    owaspCategory: 'A05:2021 – Security Misconfiguration',
    quickFix: 'Restrict Access-Control-Allow-Origin to specific trusted domains',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ VULNERABLE: Allow all origins
const cors = require('cors');
app.use(cors()); // Defaults to *`,
        fixed: `// ✅ FIXED: Whitelist specific origins
const cors = require('cors');

const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));`,
        explanation: 'Always whitelist specific origins. Never use * with credentials.',
      },
      python: {
        vulnerable: `# ❌ VULNERABLE: Allow all origins
from flask_cors import CORS
CORS(app)  # Defaults to *`,
        fixed: `# ✅ FIXED: Whitelist specific origins
from flask_cors import CORS

CORS(app, 
    origins=['https://yourdomain.com', 'https://app.yourdomain.com'],
    supports_credentials=True,
    methods=['GET', 'POST', 'PUT', 'DELETE'],
    allow_headers=['Content-Type', 'Authorization']
)`,
        explanation: 'Explicitly list allowed origins. Never use * when cookies/credentials are involved.',
      },
      java: {
        vulnerable: `// ❌ VULNERABLE: Allow all origins
@CrossOrigin(origins = "*")
public class ApiController { }`,
        fixed: `// ✅ FIXED: Whitelist specific origins
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "https://yourdomain.com",
                "https://app.yourdomain.com"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("Content-Type", "Authorization")
            .allowCredentials(true)
            .maxAge(3600);
    }
}`,
        explanation: 'Configure CORS globally with explicit origin whitelist. Avoid @CrossOrigin(origins = "*").',
      },
      go: {
        vulnerable: `// ❌ VULNERABLE: Allow all origins
w.Header().Set("Access-Control-Allow-Origin", "*")`,
        fixed: `// ✅ FIXED: Check origin against whitelist
func corsMiddleware(next http.Handler) http.Handler {
    allowed := map[string]bool{
        "https://yourdomain.com":     true,
        "https://app.yourdomain.com": true,
    }
    
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin")
        if allowed[origin] {
            w.Header().Set("Access-Control-Allow-Origin", origin)
            w.Header().Set("Access-Control-Allow-Credentials", "true")
            w.Header().Set("Access-Control-Allow-Methods", 
                "GET, POST, PUT, DELETE")
        }
        next.ServeHTTP(w, r)
    })
}`,
        explanation: 'Validate origin against whitelist before setting CORS headers.',
      },
    },
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
      'https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny',
    ],
  },

  // ==========================================
  // SPF Record (Email Security)
  // ==========================================
  'email-spf': {
    id: 'email-spf',
    title: 'SPF Record Configuration',
    description: 'No SPF record found. Without SPF, attackers can send emails that appear to come from your domain.',
    severity: 'medium',
    category: 'Email Security',
    cweId: 'CWE-290',
    owaspCategory: 'A07:2021 – Identification and Authentication Failures',
    quickFix: 'Add a TXT record with SPF policy to your DNS',
    fixes: {
      nodejs: {
        vulnerable: `# ❌ NO SPF RECORD
# Attackers can spoof emails from your domain
# No DNS TXT record for SPF exists

# Check current SPF:
nslookup -type=TXT yourdomain.com`,
        fixed: `# ✅ ADD SPF RECORD TO DNS
# DNS TXT Record for yourdomain.com:

# Basic SPF (only your mail servers):
v=spf1 mx -all

# Allow Google Workspace:
v=spf1 include:_spf.google.com ~all

# Allow Microsoft 365:
v=spf1 include:spf.protection.outlook.com -all

# Allow multiple providers:
v=spf1 mx include:_spf.google.com include:sendgrid.net -all

# SPF Qualifiers:
# +  = Pass (default)
# -  = Fail (reject)
# ~  = SoftFail (accept but mark)
# ?  = Neutral`,
        explanation: 'SPF tells receiving mail servers which IP addresses are authorized to send email for your domain. Add a TXT record to your DNS with your SPF policy.',
      },
      python: {
        vulnerable: `# ❌ NO SPF RECORD - Email spoofing possible
# Check: dig TXT yourdomain.com +short`,
        fixed: `# ✅ SPF RECORD EXAMPLES

# If using AWS SES:
v=spf1 include:amazonses.com ~all

# If using Mailgun:
v=spf1 include:mailgun.org ~all

# If using your own server (replace IP):
v=spf1 ip4:203.0.113.50 -all

# Combined example:
v=spf1 mx ip4:203.0.113.50 include:_spf.google.com -all`,
        explanation: 'Add SPF as a TXT record in your DNS provider (Cloudflare, Route53, GoDaddy, etc.).',
      },
    },
    references: [
      'https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/',
      'https://support.google.com/a/answer/33786',
    ],
  },

  // ==========================================
  // DMARC Record (Email Security)
  // ==========================================
  'email-dmarc': {
    id: 'email-dmarc',
    title: 'DMARC Record Configuration',
    description: 'No DMARC record found. DMARC prevents email spoofing by combining SPF and DKIM verification.',
    severity: 'medium',
    category: 'Email Security',
    cweId: 'CWE-290',
    owaspCategory: 'A07:2021 – Identification and Authentication Failures',
    quickFix: 'Add a DMARC TXT record to _dmarc.yourdomain.com',
    fixes: {
      nodejs: {
        vulnerable: `# ❌ NO DMARC RECORD
# Emails can be spoofed without detection
# No policy for handling failed authentication

# Check current DMARC:
nslookup -type=TXT _dmarc.yourdomain.com`,
        fixed: `# ✅ ADD DMARC RECORD TO DNS
# Create TXT record for: _dmarc.yourdomain.com

# Monitoring mode (start here):
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com

# Quarantine mode (after monitoring):
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100

# Reject mode (full protection):
v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com; pct=100

# Full example with all options:
v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:dmarc-reports@yourdomain.com; ruf=mailto:dmarc-forensic@yourdomain.com; pct=100

# Parameters:
# p=none|quarantine|reject  Policy for your domain
# sp=none|quarantine|reject Policy for subdomains
# rua=mailto:...            Aggregate report destination
# ruf=mailto:...            Forensic report destination
# pct=100                   Percentage of messages to filter
# adkim=r|s                 DKIM alignment (relaxed/strict)
# aspf=r|s                  SPF alignment (relaxed/strict)`,
        explanation: 'DMARC builds on SPF and DKIM. Start with p=none to monitor, then gradually move to quarantine and reject.',
      },
    },
    references: [
      'https://dmarc.org/overview/',
      'https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/',
    ],
  },

  // ==========================================
  // DKIM Record (Email Security)
  // ==========================================
  'email-dkim': {
    id: 'email-dkim',
    title: 'DKIM Record Configuration',
    description: 'DKIM cryptographically signs emails to prove they came from your domain.',
    severity: 'medium',
    category: 'Email Security',
    cweId: 'CWE-290',
    owaspCategory: 'A07:2021 – Identification and Authentication Failures',
    quickFix: 'Generate DKIM keys and add the public key to DNS',
    fixes: {
      nodejs: {
        vulnerable: `# ❌ NO DKIM RECORD
# Emails cannot be cryptographically verified
# Higher chance of being marked as spam`,
        fixed: `# ✅ DKIM SETUP

# 1. Generate DKIM keys (using OpenSSL):
openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

# 2. Add DNS TXT record for: selector._domainkey.yourdomain.com
# Example selector: "google" for Google Workspace, "default" for custom

# DNS Record Name:
default._domainkey.yourdomain.com

# DNS Record Value (public key without headers):
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...

# For Google Workspace:
# Admin Console → Apps → Google Workspace → Gmail → Authenticate email
# Copy the provided DKIM record to DNS

# For Microsoft 365:
# Admin → Settings → Domains → Select domain → DNS records
# Add the CNAME records provided

# For AWS SES (CLI):
aws ses verify-domain-dkim --domain yourdomain.com
# Add the 3 CNAME records returned

# Verify DKIM:
nslookup -type=TXT default._domainkey.yourdomain.com`,
        explanation: 'DKIM adds a digital signature to outgoing emails. The public key in DNS allows recipients to verify the signature.',
      },
    },
    references: [
      'https://www.cloudflare.com/learning/dns/dns-records/dns-dkim-record/',
      'https://support.google.com/a/answer/174124',
    ],
  },

  // ==========================================
  // Response Compression
  // ==========================================
  'compression': {
    id: 'compression',
    title: 'Response Compression (Brotli/GZIP)',
    description: 'No compression detected. Enabling compression reduces bandwidth and improves load times.',
    severity: 'info',
    category: 'Performance',
    quickFix: 'Enable Brotli or GZIP compression on your web server',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ NO COMPRESSION
const express = require('express');
const app = express();

// Serving uncompressed responses
app.use(express.static('public'));`,
        fixed: `// ✅ ENABLE COMPRESSION (Node.js/Express)
const express = require('express');
const compression = require('compression');

const app = express();

// Enable compression for all responses
app.use(compression({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress if > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(express.static('public'));

// Install: npm install compression`,
        explanation: 'The compression middleware automatically compresses responses using GZIP. For Brotli, use shrink-ray-current package.',
      },
      python: {
        vulnerable: `# ❌ NO COMPRESSION (Flask)
from flask import Flask
app = Flask(__name__)`,
        fixed: `# ✅ ENABLE COMPRESSION (Flask)
from flask import Flask
from flask_compress import Compress

app = Flask(__name__)
Compress(app)

# Or configure options:
app.config['COMPRESS_MIMETYPES'] = [
    'text/html', 'text/css', 'text/xml',
    'application/json', 'application/javascript'
]
app.config['COMPRESS_LEVEL'] = 6
app.config['COMPRESS_MIN_SIZE'] = 500

# Install: pip install flask-compress

# For Django:
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # ... other middleware
]`,
        explanation: 'Flask-Compress adds GZIP/Brotli compression. For Django, use the built-in GZipMiddleware.',
      },
      java: {
        vulnerable: `// ❌ NO COMPRESSION (Spring Boot)
// Default configuration without compression`,
        fixed: `// ✅ ENABLE COMPRESSION (Spring Boot)
// application.properties:
server.compression.enabled=true
server.compression.mime-types=text/html,text/css,text/plain,text/xml,application/json,application/javascript
server.compression.min-response-size=1024

// Or application.yml:
server:
  compression:
    enabled: true
    mime-types:
      - text/html
      - text/css
      - application/json
      - application/javascript
    min-response-size: 1024`,
        explanation: 'Spring Boot has built-in compression support. Just enable it in application.properties.',
      },
      go: {
        vulnerable: `// ❌ NO COMPRESSION (Go)
http.HandleFunc("/", handler)
http.ListenAndServe(":8080", nil)`,
        fixed: `// ✅ ENABLE COMPRESSION (Go)
package main

import (
    "github.com/NYTimes/gziphandler"
    "net/http"
)

func main() {
    handler := http.HandlerFunc(yourHandler)
    
    // Wrap with GZIP compression
    compressed := gziphandler.GzipHandler(handler)
    
    http.Handle("/", compressed)
    http.ListenAndServe(":8080", nil)
}

// Install: go get github.com/NYTimes/gziphandler

// For Gin framework:
import "github.com/gin-contrib/gzip"
r := gin.Default()
r.Use(gzip.Gzip(gzip.DefaultCompression))`,
        explanation: 'Use gziphandler middleware or framework-specific compression packages.',
      },
    },
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression',
      'https://web.dev/uses-text-compression/',
    ],
  },

  // ==========================================
  // Referrer-Policy Header
  // ==========================================
  'header-rp': {
    id: 'header-rp',
    title: 'Referrer-Policy Header',
    description: 'Controls how much referrer information is sent with requests.',
    severity: 'low',
    category: 'Best Practice',
    quickFix: 'Add Referrer-Policy: strict-origin-when-cross-origin header',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ NO REFERRER-POLICY
// Full URL including path and query is sent to other sites
// Potential information leakage`,
        fixed: `// ✅ ADD REFERRER-POLICY (Node.js/Express)
const helmet = require('helmet');

app.use(helmet.referrerPolicy({ 
  policy: 'strict-origin-when-cross-origin' 
}));

// Or manually:
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Policy options:
// no-referrer              - Never send referrer
// no-referrer-when-downgrade - Don't send on HTTPS→HTTP
// origin                   - Send only origin (no path)
// origin-when-cross-origin - Full URL same-site, origin cross-site
// same-origin             - Only send to same origin
// strict-origin           - Origin only, no downgrade
// strict-origin-when-cross-origin - RECOMMENDED
// unsafe-url              - Always send full URL (not recommended)`,
        explanation: 'strict-origin-when-cross-origin is the recommended default. It sends the full URL for same-origin requests but only the origin for cross-origin.',
      },
      python: {
        vulnerable: `# ❌ NO REFERRER-POLICY`,
        fixed: `# ✅ ADD REFERRER-POLICY (Flask)
from flask_talisman import Talisman

Talisman(app, referrer_policy='strict-origin-when-cross-origin')

# Or manually:
@app.after_request
def add_referrer_policy(response):
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response`,
        explanation: 'Use Flask-Talisman for comprehensive security headers.',
      },
      java: {
        vulnerable: `// ❌ NO REFERRER-POLICY`,
        fixed: `// ✅ ADD REFERRER-POLICY (Spring Security)
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.headers(headers -> headers
            .referrerPolicy(referrer -> referrer
                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
            )
        );
        return http.build();
    }
}`,
        explanation: 'Spring Security provides built-in support for Referrer-Policy.',
      },
      go: {
        vulnerable: `// ❌ NO REFERRER-POLICY`,
        fixed: `// ✅ ADD REFERRER-POLICY (Go)
func securityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
        next.ServeHTTP(w, r)
    })
}`,
        explanation: 'Add as middleware to all routes.',
      },
    },
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
    ],
  },

  // ==========================================
  // Permissions-Policy Header
  // ==========================================
  'header-pp': {
    id: 'header-pp',
    title: 'Permissions-Policy Header',
    description: 'Controls which browser features can be used on your site.',
    severity: 'low',
    category: 'Best Practice',
    quickFix: 'Add Permissions-Policy header to restrict unnecessary browser features',
    fixes: {
      nodejs: {
        vulnerable: `// ❌ NO PERMISSIONS-POLICY
// All browser features are allowed by default
// Third-party iframes can access sensitive APIs`,
        fixed: `// ✅ ADD PERMISSIONS-POLICY (Node.js/Express)
const helmet = require('helmet');

app.use(helmet.permittedCrossDomainPolicies());

// Or set manually:
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  next();
});

// Common restrictions:
// camera=()                  Disable camera
// microphone=()              Disable microphone  
// geolocation=()             Disable geolocation
// payment=()                 Disable Payment API
// usb=()                     Disable USB API
// interest-cohort=()         Disable FLoC tracking
// fullscreen=(self)          Allow fullscreen only for self
// autoplay=(self)            Allow autoplay only for self

// Full restrictive policy:
const policy = [
  'accelerometer=()',
  'camera=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
  'interest-cohort=()'
].join(', ');`,
        explanation: 'Permissions-Policy (formerly Feature-Policy) restricts browser features. Disable features you don\'t use.',
      },
      python: {
        vulnerable: `# ❌ NO PERMISSIONS-POLICY`,
        fixed: `# ✅ ADD PERMISSIONS-POLICY (Flask)
@app.after_request
def add_permissions_policy(response):
    response.headers['Permissions-Policy'] = (
        'camera=(), microphone=(), geolocation=(), '
        'interest-cohort=()'
    )
    return response

# Django settings.py:
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'
# Use django-permissions-policy package for full control`,
        explanation: 'Restrict browser features to reduce attack surface.',
      },
      java: {
        vulnerable: `// ❌ NO PERMISSIONS-POLICY`,
        fixed: `// ✅ ADD PERMISSIONS-POLICY (Spring)
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.headers(headers -> headers
            .permissionsPolicy(permissions -> permissions
                .policy("camera=(), microphone=(), geolocation=()")
            )
        );
        return http.build();
    }
}`,
        explanation: 'Configure Permissions-Policy in Spring Security.',
      },
      go: {
        vulnerable: `// ❌ NO PERMISSIONS-POLICY`,
        fixed: `// ✅ ADD PERMISSIONS-POLICY (Go)
func securityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Permissions-Policy", 
            "camera=(), microphone=(), geolocation=(), interest-cohort=()")
        next.ServeHTTP(w, r)
    })
}`,
        explanation: 'Add as middleware to all routes.',
      },
    },
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy',
      'https://www.permissionspolicy.com/',
    ],
  },

  // ==========================================
  // WAF (Web Application Firewall)
  // ==========================================
  'waf-detection': {
    id: 'waf-detection',
    title: 'Web Application Firewall (WAF)',
    description: 'No WAF detected. A WAF provides an additional layer of protection against common attacks.',
    severity: 'info',
    category: 'Protection',
    quickFix: 'Consider adding a WAF service like Cloudflare, AWS WAF, or ModSecurity',
    fixes: {
      nodejs: {
        vulnerable: `# ❌ NO WAF PROTECTION
# Application is directly exposed to:
# - SQL Injection attempts
# - XSS attacks
# - DDoS attacks
# - Bot traffic
# - Zero-day exploits`,
        fixed: `# ✅ WAF OPTIONS

# 1. CLOUDFLARE (Recommended - Easy Setup)
# - Sign up at cloudflare.com
# - Add your domain
# - Update nameservers
# - Enable "Under Attack Mode" if needed
# - Configure WAF rules in Security → WAF

# 2. AWS WAF (For AWS-hosted apps)
aws wafv2 create-web-acl \\
  --name "MyWebACL" \\
  --scope REGIONAL \\
  --default-action Allow={} \\
  --rules file://waf-rules.json

# 3. NGINX + ModSecurity
# Install ModSecurity:
apt-get install libmodsecurity3 libmodsecurity-dev

# nginx.conf:
load_module modules/ngx_http_modsecurity_module.so;

http {
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsec/main.conf;
}

# 4. Express.js rate limiting (basic protection)
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  message: 'Too many requests'
});

app.use('/api/', limiter);`,
        explanation: 'A WAF filters malicious traffic before it reaches your application. Cloud-based WAFs like Cloudflare are easiest to set up.',
      },
    },
    references: [
      'https://www.cloudflare.com/waf/',
      'https://aws.amazon.com/waf/',
      'https://owasp.org/www-project-modsecurity-core-rule-set/',
    ],
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get fix suggestion for a specific vulnerability/check
 */
export function getFixSuggestion(checkId: string): FixSuggestion | undefined {
  // Direct match
  if (FIX_SUGGESTIONS[checkId]) {
    return FIX_SUGGESTIONS[checkId];
  }
  
  // Map common check IDs to fix suggestions
  const checkIdMappings: Record<string, string> = {
    'basic-xss': 'xss',
    'xss-reflection': 'xss',
    'sqli-test': 'sqli',
    'sql-injection': 'sqli',
    'header-hsts': 'header-hsts',
    'header-csp': 'header-csp',
    'header-xfo': 'header-xfo',
    'cookie-security': 'cookie-security',
    'sensitive-files': 'sensitive-files',
    'cors-config': 'cors-config',
    'cors-policy': 'cors-config',
    // Email security
    'email-spf': 'email-spf',
    'email-dmarc': 'email-dmarc',
    'email-dkim': 'email-dkim',
    // Performance & Best Practice
    'compression': 'compression',
    'gzip': 'compression',
    'header-rp': 'header-rp',
    'header-pp': 'header-pp',
    'waf-detection': 'waf-detection',
  };
  
  const mappedId = checkIdMappings[checkId];
  if (mappedId) {
    return FIX_SUGGESTIONS[mappedId];
  }
  
  return undefined;
}

/**
 * Get all available languages for a fix suggestion
 */
export function getAvailableLanguages(fixId: string): SupportedLanguage[] {
  const fix = FIX_SUGGESTIONS[fixId];
  if (!fix) return [];
  return Object.keys(fix.fixes) as SupportedLanguage[];
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(lang: SupportedLanguage): string {
  const names: Record<SupportedLanguage, string> = {
    nodejs: 'Node.js',
    python: 'Python',
    java: 'Java',
    go: 'Go',
  };
  return names[lang];
}

