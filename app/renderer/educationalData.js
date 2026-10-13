'use strict';
/**
 * Complete Educational Knowledge Base, Scenarios, Chapters, and Quiz Engine Data
 * for Flood Attack Learning Platform.
 */

const EducationalData = {
  // =========================================================================
  // 1. REAL-LIFE APPLICATIONS & CASE STUDIES
  // =========================================================================
  applications: [
    {
      id: 'ecommerce',
      name: 'E-Commerce Platforms & Online Shopping',
      icon: '🛍️',
      summary: 'Flash sales, checkout systems, and transaction pipelines overwhelmed during peak retail events.',
      whatItDoes: 'Hosts product catalogs, shopping carts, inventory databases, payment gateways, and order processing systems for millions of shoppers.',
      howFloodAffects: 'Attackers target payment processing endpoints or web search APIs during high-stakes shopping events (e.g., Black Friday, Cyber Monday). The avalanche of fake requests exhausts web worker threads and locks database connections.',
      operationalImpact: 'Product checkout crashes. Payment transactions hang midway, creating abandoned carts. Brand reputation is severely damaged as consumers turn to rival retailers.',
      financialImpact: 'Major retailers report losing between $5,000 to $20,000 per minute of checkout downtime during Black Friday peak hours.',
      userExperience: 'Shoppers experience spinning loading spinners, HTTP 504 Gateway Timeouts, double-billing errors, or empty cart errors.',
      suitableDefenses: 'Layer 7 Web Application Firewall (WAF), Cloudflare/Akamai Anycast CDN caching, waiting-room virtual queues, and rate-limiting checkout submissions.',
      whyNotSilverBullet: 'Defenders must avoid blocking real shoppers who aggressively refresh checkout pages during sales. Overly strict rate limits cause false-positive cart drops.',
    },
    {
      id: 'banking',
      name: 'Banking & Financial Services',
      icon: '🏦',
      summary: 'Mobile banking applications, ATM network backends, and high-frequency trading gateways.',
      whatItDoes: 'Processes real-time financial fund transfers, ATM balance inquiries, wire verifications, and regulatory compliance checks.',
      howFloodAffects: 'Flooding attacks saturate the banking portal’s login authentication endpoints. Attackers often deploy volumetric floods as a distraction (smoke screen) while attempting credential stuffing or wire theft in the background.',
      operationalImpact: 'Branches cannot clear interbank payments; customers cannot check balances or transfer emergency funds; central bank regulatory sanctions trigger.',
      financialImpact: 'Regulatory fines, immediate loss of trading commissions, and severe contractual SLA penalties.',
      userExperience: 'Customers are locked out of mobile banking apps, debit card point-of-sale terminals decline transactions with "Network Communication Error".',
      suitableDefenses: 'Multi-tiered DDoS mitigation with dedicated Anycast scrubbing centers, hardware firewalls at data centers, mutual TLS (mTLS) for internal APIs, and BGP Flowspec.',
      whyNotSilverBullet: 'Financial transactions require stateful session consistency and cannot simply be cached on public edge CDNs due to strict privacy regulations.',
    },
    {
      id: 'gaming',
      name: 'Online Gaming & Multiplayer Servers',
      icon: '🎮',
      summary: 'Matchmaking servers, real-time UDP game state synchronization, and esports tournaments.',
      whatItDoes: 'Maintains sub-30ms real-time game tick updates (e.g. 64-tick or 128-tick servers) using lightweight UDP packets for players in competitive matches.',
      howFloodAffects: 'Disgruntled players or rival esports teams use stresser/booter services to bombard the server IP or individual opponents with UDP/ICMP floods, forcing high packet loss and disconnects.',
      operationalImpact: 'Competitive tournaments are suspended; server game ticks desynchronize, causing rubber-banding and rage-quitting.',
      financialImpact: 'Loss of microtransaction revenues, Twitch stream disruptions, and player migration to competitor titles.',
      userExperience: 'Ping suddenly jumps from 20ms to 999ms, characters freeze in place, and players are kicked with "Connection to Host Lost".',
      suitableDefenses: 'Specialized UDP reverse-proxy shields (e.g., AWS Shield, Cloudflare Magic Transit), game protocol deep packet inspection (DPI), and IP masking behind edge relay networks (Valve SDR).',
      whyNotSilverBullet: 'UDP is connectionless and has no built-in handshake, making spoofed UDP flood packets difficult to distinguish from genuine player movement updates.',
    },
    {
      id: 'cloud',
      name: 'Cloud Platforms & Public APIs',
      icon: '☁️',
      summary: 'Serverless functions, public REST/GraphQL APIs, and microservices hosting third-party apps.',
      whatItDoes: 'Provides scalable backend compute, database queries, and microservice mesh communication for thousands of dependent client mobile apps and web platforms.',
      howFloodAffects: 'Attackers flood public API gateway endpoints. Even with autoscaling, database connection pools get exhausted, causing cascading failures across all downstream microservices.',
      operationalImpact: 'Autoscaling creates massive runaway cloud billing costs ("Denial of Wallet"), and quotas saturate for legitimate developer integrations.',
      financialImpact: 'Thousands of dollars in cloud infrastructure billing overrun and breach of uptime enterprise SLAs.',
      userExperience: 'Developers receive HTTP 429 Too Many Requests or HTTP 503 Service Unavailable across all dependent mobile applications.',
      suitableDefenses: 'Token bucket API rate limiting per API key/client IP, strict request payload size caps, Circuit Breaker patterns in microservices, and edge caching.',
      whyNotSilverBullet: 'If attackers distribute requests across thousands of rotating residential IP proxies, simple IP-based rate limiting fails to block them without disrupting legitimate users.',
    },
    {
      id: 'education',
      name: 'Educational Institutions & Universities',
      icon: '🎓',
      summary: 'Online exam portals, university course registration systems, and student grade portals.',
      whatItDoes: 'Hosts college enrollment portals, semester course registration, assignment submission drives, and online proctored examinations.',
      howFloodAffects: 'Unprepared students or malicious actors launch flood attacks against the university web server right as an assignment deadline or exam window opens.',
      operationalImpact: 'Exam submissions fail; students miss grading windows; administrative staff are flooded with emergency helpdesk support tickets.',
      financialImpact: 'Overtime costs for university IT staff, rescheduling costs for proctored examinations, and severe student distress.',
      userExperience: 'Students stare at "504 Gateway Time-out" while their exam timer ticks down to zero.',
      suitableDefenses: 'Pre-warmed scalable cloud hosting, offloading static syllabus content to CDNs, Captcha challenges on login pages, and local IP filtering.',
      whyNotSilverBullet: 'Universities often operate on restricted educational IT budgets and cannot always afford expensive enterprise DDoS scrubbing subscriptions.',
    },
    {
      id: 'healthcare',
      name: 'Healthcare Systems & Hospital Portals',
      icon: '🏥',
      summary: 'Electronic Health Record (EHR) sync, telemedicine consultations, and ambulance dispatch networks.',
      whatItDoes: 'Connects emergency rooms with patient medical histories, prescription systems, and ambulance routing dispatch networks.',
      howFloodAffects: 'Attackers overwhelm healthcare network gateways, cutting off access to centralized patient allergy records, surgical schedules, or emergency dispatch routing.',
      operationalImpact: 'Doctors cannot retrieve medical history; emergency room triage is delayed; ambulances must be manually rerouted via radio.',
      financialImpact: 'Ransomware extortion leverage and emergency system recovery costs, with direct risk to human lives.',
      userExperience: 'Hospital staff are forced into paper-based offline emergency procedures; telemedicine video appointments disconnect mid-consultation.',
      suitableDefenses: 'Air-gapped critical networks, redundant secondary private connections, strict ingress firewall filters, and government-tier cybersecurity incident response plans.',
      whyNotSilverBullet: 'Legacy healthcare medical equipment often uses older operating systems that lack modern host-based firewall and rate-limiting controls.',
    },
    {
      id: 'government',
      name: 'Government Websites & Public Services',
      icon: '🏛️',
      summary: 'Tax filing portals, election result dissemination, and public emergency announcement systems.',
      whatItDoes: 'Delivers vital public information, weather warnings, tax submission portals, and citizen identity verification.',
      howFloodAffects: 'Nation-state adversaries or hacktivists launch geopolitical DDoS floods to paralyze government communications or create civil confusion during elections or tax deadlines.',
      operationalImpact: 'Public cannot file timely tax returns or access emergency disaster warnings; loss of public confidence in digital governance.',
      financialImpact: 'Disruption to revenue collection mechanisms and massive governmental remediation expenditures.',
      userExperience: 'Citizens see "Site Cannot Be Reached" and cannot access public forms or crisis helplines.',
      suitableDefenses: 'National cybersecurity center scrubbing centers, strict geo-blocking during active crisis events, Anycast edge routing, and resilient static mirror sites.',
      whyNotSilverBullet: 'Government portals must remain universally accessible to all citizens, including those with older devices or behind shared rural IP networks, limiting aggressive filtering.',
    },
    {
      id: 'enterprise',
      name: 'Enterprise Communication & Collaboration',
      icon: '💼',
      summary: 'VoIP phone switches, video conferencing bridges, and business collaboration platforms (Teams/Slack).',
      whatItDoes: 'Transmits real-time audio and video packets, corporate instant messaging, and internal corporate document sharing.',
      howFloodAffects: 'Floods target Session Initiation Protocol (SIP) VoIP PBX switches with fraudulent call setup requests or UDP audio packet floods.',
      operationalImpact: 'Customer service call centers go silent; remote employees cannot hold meetings or connect with clients.',
      financialImpact: 'Lost enterprise sales leads and customer support escalation penalties.',
      userExperience: 'Audio stutters with robotic artifacts, calls drop every 10 seconds, and video conferences freeze completely.',
      suitableDefenses: 'Session Border Controllers (SBC) with automated rate-limiting, SIP authentication challenges, and private leased lines.',
      whyNotSilverBullet: 'Audio/Video streaming cannot tolerate packet buffering delays; even 1-2% dropped packets degrade voice intelligibility.',
    },
  ],

  // Flash Crowds vs Floods
  flashCrowdComparison: [
    {
      feature: 'Traffic Origin & IPs',
      flashCrowd: 'Thousands of diverse, legitimate residential and mobile IP addresses distributed naturally.',
      floodAttack: 'Often clusters from single IPs, known botnet subnets, datacenter proxies, or spoofed non-routable addresses.',
    },
    {
      feature: 'Request Patterns',
      flashCrowd: 'Full browser behavior: downloads HTML, requests images, executes JS scripts, and navigates pages logically.',
      floodAttack: 'Repetitive automated requests: spamming ping Echo Requests, identical URLs, or incomplete TCP SYN handshakes.',
    },
    {
      feature: 'Protocol Legitimacy',
      flashCrowd: 'Completes 3-way TCP handshakes, negotiates TLS/SSL ciphers, and sends valid HTTP user-agents and cookies.',
      floodAttack: 'Malformed headers, missing referrers, random query strings, or raw Layer 3/4 packet blasts.',
    },
    {
      feature: 'Defensive Solution',
      flashCrowd: 'Scale up capacity: add CDN caching, auto-scale web servers, activate queueing systems.',
      floodAttack: 'Filter and drop: enforce rate-limits, block offending signatures, activate upstream scrubbing.',
    },
  ],

  // Documented Case Studies
  caseStudies: [
    {
      title: 'Dyn DNS Mirai Botnet Attack (October 2016)',
      date: 'October 21, 2016',
      vector: 'DNS Water Torture & Volumetric Mirai Botnet Flood (1.2 Tbps)',
      targets: 'Dyn Inc. (Major Managed DNS Service Provider)',
      whatHappened: 'The Mirai malware scanned the internet for IoT devices (security cameras, DVRs, home routers) that had default factory passwords like "admin/admin". It compromised over 100,000 devices and weaponized them into a botnet. On October 21, it launched an unprecedented 1.2 Tbps flood against Dyn DNS servers.',
      impact: 'Major internet platforms that relied on Dyn for DNS resolution—including Twitter, Spotify, Netflix, Reddit, GitHub, and Airbnb—became unreachable for hours across North America and Europe.',
      source: 'NIST Incident Summary & Dyn Security Post-Mortem Report',
      takeaway: 'Demonstrated the vulnerability of IoT devices and showed that targeting a single shared infrastructure component (DNS) can bring down dozens of unrelated internet giants.',
    },
    {
      title: 'GitHub 1.35 Tbps Memcached Amplification Attack (February 2018)',
      date: 'February 28, 2018',
      vector: 'Memcached UDP Reflection/Amplification (Amplification Factor: 50,000x)',
      targets: 'GitHub Code Hosting Platform',
      whatHappened: 'Attackers spoofed GitHub’s IP address and sent small 1-byte queries over UDP Port 11211 to misconfigured Memcached database servers exposed publicly on the internet. The Memcached servers responded with massive 50KB payloads back toward GitHub’s IP. This amplified the attack volume by 50,000 times, hitting GitHub with 1.35 Terabits per second and 126.9 million PPS.',
      impact: 'GitHub experienced brief service degradation, but because it had automated DDoS protection through Akamai Prolexic, traffic was automatically routed to scrubbing centers and normalized within 8 minutes.',
      source: 'GitHub Engineering Incident Report (February 28, 2018)',
      takeaway: 'Proved the effectiveness of upstream cloud scrubbing centers: absorbing a 1.35 Tbps attack at the edge prevented the target data center’s physical connection from saturating.',
    },
    {
      title: 'HTTP/2 Rapid Reset Attack (October 2023)',
      date: 'August - October 2023',
      vector: 'HTTP/2 Stream Multiplexing RST_STREAM Flood (CVE-2023-44487)',
      targets: 'Cloudflare, Google Cloud, AWS Public Edge Infrastructure',
      whatHappened: 'Attackers exploited a architectural feature of the HTTP/2 protocol. In HTTP/2, a client can open multiple parallel request streams on a single TCP connection. Attackers sent a request and immediately cancelled it with an RST_STREAM frame, repeating this hundreds of thousands of times per second. This forced servers to process requests without finishing them, peaking at an astonishing 398 million requests per second.',
      impact: 'Global cloud providers worked together under coordinated disclosure to patch HTTP/2 implementations, deploy rate-limiting on stream resets, and update web server software.',
      source: 'Google Cloud Security / Cloudflare / AWS Coordinated Vulnerability Disclosure (CVE-2023-44487)',
      takeaway: 'Showed that flood attacks do not just rely on raw bandwidth (Gbps); novel protocol design flaws can exhaust server CPU with surprisingly modest network pipes.',
    },
  ],

  // =========================================================================
  // 2. NOTES: 25 COMPLETE CHAPTERS
  // =========================================================================
  chapters: [
    {
      id: 1,
      title: 'Introduction to Cybersecurity',
      definition: 'Cybersecurity is the discipline and practice of protecting digital devices, networks, programs, and data from unauthorized access, damage, or disruption.',
      explanation: 'Every day, billions of people rely on computers to bank, study, communicate, and work. Cybersecurity is not just about stopping secret espionage; it is about building reliable, resilient systems that work safely even when bad actors try to break them.',
      analogy: 'Imagine a house. Cybersecurity is the combination of sturdy front door locks, window latches, smoke alarms, a fence around the perimeter, and ensuring the driveway isn’t blocked by debris.',
      example: 'Setting up firewalls on your laptop and using two-factor authentication on your student email account are fundamental cybersecurity practices.',
      diagram: '[Users & Devices] ───(Secured Connections)───> [Protected Digital Systems & Data]',
      keyTerms: ['Cybersecurity', 'Threat Actor', 'Resilience', 'Attack Surface'],
      qna: [
        { q: 'What is the primary goal of cybersecurity?', a: 'To protect systems, networks, and data from unauthorized access, theft, damage, and disruption.' },
        { q: 'Is cybersecurity only concerned with confidential data theft?', a: 'No. Ensuring that systems remain online, usable, and functioning (Availability) is equally important.' },
        { q: 'Name a common everyday cybersecurity control.', a: 'Multi-factor authentication (MFA) or host firewalls.' },
      ],
      summary: 'Cybersecurity guarantees that digital systems remain safe, trustworthy, and available for authorized users.',
    },
    {
      id: 2,
      title: 'The CIA Triad: Confidentiality, Integrity, and Availability',
      definition: 'The CIA Triad is the foundational information security model composed of Confidentiality, Integrity, and Availability.',
      explanation: 'Security professionals evaluate every risk against three pillars: Confidentiality ensures secrets stay secret; Integrity ensures data is not altered or forged; and Availability ensures systems work when authorized users need them. Flood attacks primarily target Availability.',
      analogy: 'In a bank: Confidentiality means cashiers cannot read your private balance out loud. Integrity means no one can secretly alter your bank balance. Availability means the ATM isn’t broken when you need emergency cash.',
      example: 'A ransomware attack that locks your hospital database violates Availability and Integrity; an ICMP flood violates Availability.',
      diagram: '+-------------------+\n|   THE CIA TRIAD   |\n| C: Confidentiality|\n| I: Integrity      |\n| A: Availability  <-- Targeted by Flood Attacks!\n+-------------------+',
      keyTerms: ['CIA Triad', 'Confidentiality', 'Integrity', 'Availability', 'SLA'],
      qna: [
        { q: 'Which pillar of the CIA Triad does a flood attack primarily violate?', a: 'Availability.' },
        { q: 'Does an ICMP flood attack steal passwords or decrypt secret data?', a: 'No. It leaves Confidentiality intact while denying legitimate access.' },
        { q: 'Why is Availability critical for hospital networks?', a: 'Because doctors require real-time access to patient allergy records and emergency dispatch systems.' },
      ],
      summary: 'The CIA Triad guides security priorities. Flood attacks are dangerous availability attacks.',
    },
    {
      id: 3,
      title: 'Computer Network Fundamentals',
      definition: 'A computer network is a collection of interconnected devices that exchange data using standardized communication protocols.',
      explanation: 'When two computers communicate over the internet, data is not transmitted as an unbroken stream. Instead, it is divided into small digital packets, routed across intermediate switches and routers, and reassembled at the destination.',
      analogy: 'A computer network functions like an international highway system: routers are highway interchanges, packets are cars carrying cargo, and bandwidth is the width of the road.',
      example: 'Connecting your smartphone to your campus WiFi network creates a network link between your phone, local access points, and internet servers.',
      diagram: '[Your Computer] ──(Ethernet / WiFi)──> [Router] ──(Fiber ISP)──> [Remote Server]',
      keyTerms: ['Network', 'Router', 'Switch', 'Packet', 'Protocol'],
      qna: [
        { q: 'How is data transmitted over computer networks?', a: 'By dividing large files into small, manageable digital packets.' },
        { q: 'What is the role of a network router?', a: 'To direct packets along the best path from the sender to the destination across interconnected networks.' },
        { q: 'What determines the maximum data that can flow through a network connection?', a: 'The connection bandwidth (e.g., 100 Mbps or 1 Gbps).' },
      ],
      summary: 'Networks link systems together using routers, switches, and standardized digital packet flows.',
    },
    {
      id: 4,
      title: 'Clients, Servers, IP Addresses, Ports, and Packets',
      definition: 'Network communication relies on Clients requesting resources from Servers, located by IP addresses and specific service Ports.',
      explanation: 'Every connected device has an IP Address (its digital street address). Servers host multiple applications, so Port Numbers (digital apartment doors) specify which app gets which message (e.g. Port 80 for web). Packets wrap data with header addresses.',
      analogy: 'Sending a letter: The IP Address is the building street address (500 Campus Dr), the Port is the apartment room number (#80 for the Cafeteria), and the Packet is the envelope.',
      example: 'When you open `http://example.com`, your client sends packets to `example.com`’s IP address on Port 80.',
      diagram: '[Client: 192.168.1.10:50221] ────── Packet ──────> [Server: 203.0.113.5:80]',
      keyTerms: ['Client', 'Server', 'IP Address', 'Port Number', 'Packet Header', 'Payload'],
      qna: [
        { q: 'What is the difference between an IP address and a port number?', a: 'An IP address identifies the device on the network; a port number identifies the specific application on that device.' },
        { q: 'What standard port is used for plaintext HTTP web browsing?', a: 'Port 80 (and Port 443 for encrypted HTTPS).' },
        { q: 'What two main parts make up a network packet?', a: 'The Header (addressing metadata) and the Payload (actual data).' },
      ],
      summary: 'Clients talk to servers using IP addresses for device location and ports for application routing.',
    },
    {
      id: 5,
      title: 'Network Protocols: ICMP, TCP, UDP, and HTTP',
      definition: 'Protocols are standardized sets of rules that define how data is structured, transmitted, and received across networks.',
      explanation: 'TCP guarantees delivery through handshakes and acknowledgments; UDP sends fast data without waiting for replies; ICMP handles diagnostic reporting; and HTTP powers the World Wide Web.',
      analogy: 'TCP is like registered certified mail requiring a signature. UDP is like a megaphone broadcast in a park. ICMP is a postal status inquiry card. HTTP is ordering from a restaurant menu.',
      example: 'Watching a live video stream uses UDP for speed; logging into your bank uses TCP and HTTPS for guaranteed accuracy.',
      diagram: '+---------------------------------------------------------+\n| Layer 7: HTTP (Application Content: Webpages, APIs)     |\n| Layer 4: TCP (Reliable Streams) / UDP (Fast Datagrams)  |\n| Layer 3: ICMP (Network Diagnostics: Ping & Errors)      |\n+---------------------------------------------------------+',
      keyTerms: ['Protocol', 'TCP', 'UDP', 'ICMP', 'HTTP', 'Handshake'],
      qna: [
        { q: 'Which protocol is connection-oriented and guarantees packet delivery?', a: 'TCP (Transmission Control Protocol).' },
        { q: 'Which protocol is lightweight and used for real-time multiplayer gaming and live streams?', a: 'UDP (User Datagram Protocol).' },
        { q: 'What is the primary role of ICMP?', a: 'Reporting errors and diagnosing network connectivity status.' },
      ],
      summary: 'Different protocols serve different tasks: TCP ensures reliability, UDP delivers speed, and ICMP checks health.',
    },
    {
      id: 6,
      title: 'How Ping, Echo Requests, and Echo Replies Work',
      definition: 'Ping is a network diagnostic utility that uses ICMP Echo Request and Echo Reply messages to verify host reachability and round-trip latency.',
      explanation: 'When you run `ping 8.8.8.8`, your computer sends an ICMP Echo Request (Type 8). If the remote server is active and permits ping, it answers with an ICMP Echo Reply (Type 0). The time between request and reply is the round-trip latency (RTT).',
      analogy: 'Ping is like shouting "Marco!" across a swimming pool. If your friend is present and listening, they shout back "Polo!" Measuring how long it takes tells you how far away they are.',
      example: 'Typing `ping google.com` in your terminal to check if your internet connection is working.',
      diagram: '[Your PC] ──── ICMP Echo Request (Type 8) ────> [Remote Host]\n[Your PC] <─── ICMP Echo Reply (Type 0)   <──── [Remote Host]\nLatency = 15 ms | Packet Loss = 0%',
      keyTerms: ['Ping', 'Echo Request', 'Echo Reply', 'Latency (RTT)', 'ICMP Type 8', 'ICMP Type 0'],
      qna: [
        { q: 'What ICMP message type represents an Echo Request?', a: 'ICMP Type 8.' },
        { q: 'What ICMP message type represents an Echo Reply?', a: 'ICMP Type 0.' },
        { q: 'What metric does ping calculate?', a: 'Round-trip time (latency in milliseconds) and packet loss percentage.' },
      ],
      summary: 'Ping tests network reachability through simple ICMP Echo Request and Reply cycles.',
    },
    {
      id: 7,
      title: 'Flood Attacks and Their Objectives',
      definition: 'A flood attack is a deliberate attempt to make a targeted system, server, or network unusable by inundating it with massive amounts of traffic.',
      explanation: 'Unlike stealthy hacks that quietly steal files, flood attacks are brute-force assaults. The attacker’s objective is system paralysis: making the service completely unavailable to genuine users, causing financial loss, reputational damage, or distraction.',
      analogy: 'Imagine ordering 500 fake pizzas to a rival business’s office so the delivery drivers block the parking lot and staff cannot enter.',
      example: 'Launching 50,000 ping packets per second at a web server so its CPU cannot respond to regular website visitors.',
      diagram: '[Attacker] ══════ Avalanche of Fake Traffic ══════> [Target Server: OVERLOADED]',
      keyTerms: ['Flood Attack', 'Denial of Service', 'System Paralysis', 'Exhaustion'],
      qna: [
        { q: 'What is the main objective of a flood attack?', a: 'To disrupt availability and prevent legitimate users from accessing the system.' },
        { q: 'Does a flood attack depend on finding software vulnerabilities or bugs in code?', a: 'Not necessarily; it often relies on sheer traffic volume overwhelming finite resources.' },
        { q: 'What happens to genuine requests during a flood attack?', a: 'They are delayed, dropped, or timed out.' },
      ],
      summary: 'Flood attacks aim to paralyze systems through overwhelming traffic volume rather than secret data theft.',
    },
    {
      id: 8,
      title: 'DoS versus DDoS versus Flood Attacks',
      definition: 'DoS (Denial of Service) originates from a single machine, while DDoS (Distributed Denial of Service) coordinates thousands of compromised machines (botnets).',
      explanation: 'A single attacker PC (DoS) is easy to mitigate by blocking its single IP address. A DDoS attack uses a botnet of thousands of hacked computers around the world. Because traffic arrives from all directions simultaneously, simple single-IP blocking fails.',
      analogy: 'A DoS attack is one angry person shouting in a library. The librarian can easily escort them out. A DDoS attack is a flash mob of 5,000 people shouting in the library simultaneously.',
      example: 'Using `hping3` on your laptop against a local container is a DoS; the 2016 Mirai IoT attack on Dyn was a massive DDoS.',
      diagram: 'DoS:  [Attacker PC] ───────────────────────────> [Target]\nDDoS: [Bot 1] ───┐\n      [Bot 2] ────┼───> [Command Server] ──> [Target (Swarmed!)]\n      [Bot 3] ───┘',
      keyTerms: ['DoS', 'DDoS', 'Botnet', 'Command & Control (C2)', 'Distributed'],
      qna: [
        { q: 'What is the main difference between DoS and DDoS?', a: 'DoS uses one traffic source; DDoS distributes attack traffic across many infected machines.' },
        { q: 'What is a botnet?', a: 'A network of compromised computers or IoT devices controlled by an attacker.' },
        { q: 'Why is a DDoS attack harder to defend against than a DoS attack?', a: 'Because traffic arrives from thousands of distinct IP addresses, making single-IP firewall rules useless.' },
      ],
      summary: 'DDoS amplifies flood attacks by weaponizing thousands of distributed machines simultaneously.',
    },
    {
      id: 9,
      title: 'ICMP Flood Attacks (Ping Flooding)',
      definition: 'An ICMP Flood (or Ping Flood) is a DoS attack where the target is bombarded with excessive ICMP Echo Request packets.',
      explanation: 'For every Echo Request received, the target’s operating system must generate an Echo Reply. In an ICMP flood, incoming packets arrive faster than the CPU and network card can process them. The target burns CPU cycles answering bogus pings while legitimate packets are dropped.',
      analogy: 'Repeatedly ringing an office doorbell hundreds of times every minute until the receptionist cannot answer client phone calls.',
      example: 'Running `hping3 --icmp --flood target` inside our isolated container sends thousands of ICMP packets per second.',
      diagram: '[Attacker] ───(35,000 PPS Echo Requests)───> [Target NIC] ──> [CPU SoftIRQs at 100%]',
      keyTerms: ['ICMP Flood', 'Ping Flood', 'Echo Request Flood', 'hping3', 'Kernel Interrupt'],
      qna: [
        { q: 'What protocol is exploited in a ping flood?', a: 'ICMP (Internet Control Message Protocol).' },
        { q: 'Why does an ICMP flood burden the target server?', a: 'Because the operating system spends processor resources parsing incoming requests and transmitting replies.' },
        { q: 'How can an ICMP flood be mitigated at the host level?', a: 'By configuring iptables rate-limiting or dropping incoming Echo Requests.' },
      ],
      summary: 'ICMP floods weaponize diagnostic ping requests to exhaust target CPU and bandwidth.',
    },
    {
      id: 10,
      title: 'TCP SYN Flood Attacks',
      definition: 'A TCP SYN flood is an attack that exploits the TCP three-way handshake by leaving connections in a half-open state until memory queues overflow.',
      explanation: 'To open a TCP connection, a client sends SYN, the server replies SYN-ACK, and the client sends ACK. In a SYN flood, the attacker sends thousands of SYN requests but never sends the final ACK. The server holds memory slots open waiting for replies, until its connection queue fills up.',
      analogy: 'Calling a restaurant to make a table reservation for 50 people, then hanging up before confirming. The restaurant holds the empty tables, turning away real diners.',
      example: 'Flooding Port 80 with SYN packets from spoofed IP addresses so real web visitors cannot establish a TCP connection.',
      diagram: '[Attacker] ───── SYN ─────> [Server: Allocates Memory Slot]\n[Attacker] <─── SYN-ACK ─── [Server: Awaiting ACK...]\n[Attacker] (Never replies!)  [Server: Memory Queue Full -> CRASH]',
      keyTerms: ['SYN Flood', 'Three-Way Handshake', 'Half-Open Connection', 'SYN Cookies', 'Backlog Queue'],
      qna: [
        { q: 'What stage of the TCP handshake does a SYN flood exploit?', a: 'The initial SYN and half-open waiting state.' },
        { q: 'What resource on the server is exhausted during a SYN flood?', a: 'The TCP connection backlog queue in system memory (RAM).' },
        { q: 'What defensive mechanism helps mitigate TCP SYN floods without allocating memory?', a: 'SYN Cookies.' },
      ],
      summary: 'SYN floods exhaust server connection tables by leaving TCP handshakes incomplete.',
    },
    {
      id: 11,
      title: 'UDP Flood Attacks',
      definition: 'A UDP flood is an attack where large volumes of User Datagram Protocol packets are sent to random ports on the target host.',
      explanation: 'Because UDP is connectionless, attackers can blast packets without establishing a handshake. When the target server receives a UDP packet on an unopened port, it must check for listening programs and send back an ICMP "Destination Unreachable" packet, exhausting outbound bandwidth and CPU.',
      analogy: 'Dumping thousands of unaddressed parcels onto a mail sorting room floor. Workers waste hours opening parcels only to find no recipient exists.',
      example: 'Bombarding ports 10000 through 60000 with UDP packets carrying random junk bytes.',
      diagram: '[Attacker] ═══ UDP Random Ports ═══> [Target Server: Checks Ports -> Sends ICMP Unreachable]',
      keyTerms: ['UDP Flood', 'Connectionless', 'Destination Unreachable', 'Port Scanning Exhaustion'],
      qna: [
        { q: 'Why is UDP easier to flood than TCP?', a: 'Because UDP has no handshake or acknowledgment mechanism, allowing rapid fire-and-forget transmission.' },
        { q: 'What does a server do when it receives a UDP packet on an inactive port?', a: 'It returns an ICMP Destination Unreachable packet.' },
        { q: 'What is the primary impact of large-scale UDP floods?', a: 'Bandwidth saturation and packet queue exhaustion.' },
      ],
      summary: 'UDP floods saturate bandwidth and processing queues with rapid, connectionless datagram blasts.',
    },
    {
      id: 12,
      title: 'HTTP Flood Attacks (Layer 7 Application Floods)',
      definition: 'An HTTP flood is an application-layer attack where attackers send seemingly legitimate HTTP GET or POST requests to exhaust web server and database resources.',
      explanation: 'Unlike network-layer floods that target routers and network cards, HTTP floods target the application software (e.g. Node.js, Apache, PostgreSQL). Each request forces the web server to parse headers, query databases, and generate complex HTML pages, consuming heavy CPU.',
      analogy: 'Hiring 100 people to walk into a restaurant and each order the most complicated multi-course meal on the menu, tying up the kitchen for hours.',
      example: 'Sending 10,000 requests per minute to `/search?q=everything` on an e-commerce website.',
      diagram: '[Attacker Bots] ─── HTTP GET /heavy-database-query ───> [Web Server] ──> [Database CPU: 100%]',
      keyTerms: ['HTTP Flood', 'Layer 7', 'Application Layer', 'Web Server Exhaustion', 'Database Saturation'],
      qna: [
        { q: 'At which OSI layer does an HTTP flood operate?', a: 'Layer 7 (Application Layer).' },
        { q: 'Why are HTTP floods harder to detect than ICMP floods?', a: 'Because HTTP requests appear structurally valid and legitimate to basic network firewalls.' },
        { q: 'What defense can challenge automated HTTP flood bots?', a: 'A Web Application Firewall (WAF) using CAPTCHA challenges or JavaScript tests.' },
      ],
      summary: 'Layer 7 HTTP floods exhaust web server and database engines using complex requests.',
    },
    {
      id: 13,
      title: 'How Attackers Overwhelm Network and System Resources',
      definition: 'Attackers create bottlenecks across four finite system resources: Network Bandwidth, Packet Processing Rate (PPS), CPU Cycles, and RAM Memory Buffers.',
      explanation: 'Every server is constrained by physical limits: its network cable bandwidth, its CPU interrupt handling speed, and its operating system socket buffer space. By targeting one or more of these bottlenecks, an attacker forces the system into resource starvation.',
      analogy: 'A restaurant has 4 bottlenecks: parking spaces (bandwidth), the front door (PPS), the chefs in the kitchen (CPU), and dining tables (RAM). Jamming any one will break the business.',
      example: 'A 40,000 PPS ICMP flood saturates CPU interrupts; a 10 Gbps UDP flood saturates physical bandwidth; a SYN flood fills RAM connection tables.',
      diagram: '+------------------------------------------------------+\n| SYSTEM BOTTLENECKS:                                  |\n| [1] Bandwidth (Gbps)  --> Network pipe saturation    |\n| [2] PPS (Rate)        --> CPU kernel interrupts      |\n| [3] Memory (RAM)      --> Socket connection queues   |\n| [4] CPU (%)           --> Application processing     |\n+------------------------------------------------------+',
      keyTerms: ['Resource Starvation', 'Bottleneck', 'Throughput', 'Saturation', 'Queue Overflow'],
      qna: [
        { q: 'What are the four primary resources targeted in flood attacks?', a: 'Bandwidth, Packets Per Second (PPS), CPU utilization, and RAM memory queues.' },
        { q: 'Can a fast multi-core CPU prevent bandwidth saturation?', a: 'No; if the physical network cable is full of packets, traffic cannot reach the CPU regardless of its speed.' },
        { q: 'What happens when operating system packet queues overflow?', a: 'Subsequent incoming packets are immediately dropped.' },
      ],
      summary: 'Floods succeed by forcing physical bandwidth, PPS, CPU, or RAM beyond hardware limits.',
    },
    {
      id: 14,
      title: 'CPU Utilization, Memory, Latency, Bandwidth, PPS, and Packet Loss',
      definition: 'These six metrics form the essential telemetry dashboard for measuring network health and detecting flood attacks.',
      explanation: 'Healthy systems display low CPU (<10%), stable memory, low latency (<30ms), modest PPS (<100), and 0% packet loss. During a flood attack, PPS spikes to thousands, CPU climbs, latency skyrockets, and packet loss increases dramatically.',
      analogy: 'Vital signs for a human: Heart rate (PPS), body temperature (CPU), blood pressure (Bandwidth), and oxygen level (Latency/Loss).',
      example: 'In our VLab live demo, watching PPS jump from 2 PPS to 35,000 PPS while CPU climbs from 1.5% to 28% core limit.',
      diagram: '+-------------------+--------------------+--------------------+\n| HEALTHY TELEMETRY | ATTACK IN PROGRESS | MITIGATED DEFENSE  |\n| CPU: 1.5%         | CPU: 28.5% (Max)   | CPU: 3.5%          |\n| PPS: 2 PPS        | PPS: 35,000 PPS    | PPS: 2 PPS         |\n| Latency: 5ms      | Latency: TIMEOUT   | Latency: 7ms       |\n+-------------------+--------------------+--------------------+',
      keyTerms: ['CPU Utilization', 'PPS', 'Latency', 'Bandwidth', 'Packet Loss', 'Telemetry'],
      qna: [
        { q: 'What does PPS stand for?', a: 'Packets Per Second.' },
        { q: 'What typically happens to latency (lag) during a flood attack?', a: 'It spikes dramatically or results in connection timeouts.' },
        { q: 'What does 100% packet loss indicate?', a: 'None of the sent packets are successfully reaching the destination or receiving replies.' },
      ],
      summary: 'Telemetry metrics like PPS, CPU, latency, and packet loss provide immediate insight into system health.',
    },
    {
      id: 15,
      title: 'Detecting Abnormal Traffic and Establishing Baselines',
      definition: 'A baseline is a measured profile of normal network traffic patterns used as a benchmark to detect anomalies and attacks.',
      explanation: 'You cannot identify an abnormal spike without knowing what normal looks like. By analyzing traffic over days, weeks, and seasons, security teams establish normal thresholds (e.g., normal peak is 500 PPS). Anything exceeding this by a wide margin triggers an anomaly alert.',
      analogy: 'A security guard knowing that 20 people enter a library on a typical afternoon. If 3,000 people suddenly rush the doors, the guard instantly knows an anomaly is occurring.',
      example: 'Setting an automated monitoring alert when incoming ICMP traffic exceeds 5,000 PPS for more than 3 consecutive seconds.',
      diagram: '[Normal Baseline: 50 PPS] ───(Sudden 30,000 PPS Spike)───> [Anomaly Threshold Breached! -> ALERT]',
      keyTerms: ['Baseline', 'Anomaly Detection', 'Threshold', 'False Positive', 'Traffic Profile'],
      qna: [
        { q: 'Why is establishing a traffic baseline essential for defense?', a: 'Because you cannot distinguish an attack spike without knowing the normal expected volume.' },
        { q: 'What is a false positive in anomaly detection?', a: 'Mistaking a legitimate surge of traffic (e.g. a flash sale) for a malicious cyberattack.' },
        { q: 'How do security teams establish accurate baselines?', a: 'By monitoring traffic trends across hours, weekdays, and seasonal events over time.' },
      ],
      summary: 'Baselines define normal operational parameters, enabling rapid detection of traffic anomalies.',
    },
    {
      id: 16,
      title: 'Log Analysis and Traffic Monitoring',
      definition: 'Log analysis is the systematic examination of computer event logs to identify attack signatures, source addresses, and timing patterns.',
      explanation: 'Operating systems and network services write records of events into log files (e.g. `/var/log/syslog` or firewall drop logs). Monitoring tools (such as SIEM platforms or VLab’s activity stream) aggregate these logs in real time to provide event context.',
      analogy: 'A building visitor sign-in ledger. Reviewing the ledger lets security investigators see who entered, at what time, and what door they used.',
      example: 'Examining iptables drop counters to verify that 34,990 ICMP packets were discarded in the past second.',
      diagram: '[Firewall Drop Events] ──> [Activity Log Stream] ──> [Security Analyst Dashboard]',
      keyTerms: ['Event Log', 'Log Analysis', 'SIEM', 'Audit Trail', 'Ring Buffer'],
      qna: [
        { q: 'What information does a firewall event log typically record?', a: 'Timestamp, source IP address, destination IP address, protocol, port, and action taken (accept or drop).' },
        { q: 'What is a ring buffer in logging?', a: 'A fixed-size memory buffer that stores recent log entries and overwrites the oldest ones when full.' },
        { q: 'Why is log export functionality important in security labs?', a: 'It allows students and auditors to preserve an immutable record of incident experiments.' },
      ],
      summary: 'Logs provide an audit trail of network events, enabling incident diagnosis and evidence preservation.',
    },
    {
      id: 17,
      title: 'Rate Limiting and Firewall Filtering',
      definition: 'Rate limiting restricts packet intake to a safe maximum rate, while firewall filtering discards packets matching specific forbidden criteria.',
      explanation: 'Rate limiting uses algorithms like the Token Bucket to allow a reasonable number of requests (e.g., 1 ping per second with a burst of 5) while dropping excess volume. Firewalls (like Linux iptables) inspect packet headers at the kernel level and drop traffic before it reaches user applications.',
      analogy: 'A firewall is a security guard checking tickets at the gate. Rate limiting is a turnstile that only rotates once every two seconds to prevent a stampede.',
      example: '`iptables -A INPUT -p icmp -m limit --limit 1/s --limit-burst 5 -j ACCEPT`',
      diagram: '[Incoming Flood: 35,000 PPS] ──> [iptables Netfilter Engine]\n                                       ├──> 1 PPS Accepted (Legitimate)\n                                       └──> 34,999 PPS Dropped at Kernel Level',
      keyTerms: ['Rate Limiting', 'Firewall', 'iptables', 'Token Bucket', 'Packet Dropping'],
      qna: [
        { q: 'What does the `--limit 1/s` rule in iptables do?', a: 'It allows an average of only 1 matching packet per second to pass.' },
        { q: 'What does `--limit-burst 5` mean in an iptables rate-limit rule?', a: 'It permits an initial burst of up to 5 packets before strict rate limiting engages.' },
        { q: 'Why is kernel-level dropping more efficient than application-level dropping?', a: 'Because the operating system discards the packet immediately without allocating user memory or CPU threads.' },
      ],
      summary: 'Rate limiting and firewalls filter out junk traffic in the kernel before application resources are exhausted.',
    },
    {
      id: 18,
      title: 'Network-Level DDoS Protection and Traffic Scrubbing',
      definition: 'DDoS scrubbing is a cloud-based defense where incoming public traffic is routed through specialized cleaning centers that filter out malicious packets before forwarding clean data to the server.',
      explanation: 'When attack volume exceeds a server’s physical internet pipe (e.g., a 50 Gbps flood hitting a 1 Gbps connection), no local firewall can save it. Anycast BGP routing diverts the flood across dozens of global cloud scrubbing centers, filtering out junk packets at the internet edge.',
      analogy: 'A municipal storm drain diversion system. When a torrential flash flood hits, storm gates divert excess floodwater into retention basins before city streets are submerged.',
      example: 'Services like Cloudflare Magic Transit, AWS Shield Advanced, and Akamai Prolexic.',
      diagram: '[Botnet Flood: 500 Gbps] ──> [Global Scrubbing Center] ──(Clean 10 Mbps Traffic)──> [Origin Server]',
      keyTerms: ['Traffic Scrubbing', 'Anycast', 'BGP Routing', 'Edge Filtering', 'Cloud DDoS Protection'],
      qna: [
        { q: 'When is a local host firewall insufficient to stop a DDoS attack?', a: 'When the attack volume saturates the physical internet bandwidth of the host’s connection.' },
        { q: 'How does an Anycast network assist in DDoS mitigation?', a: 'It distributes incoming traffic across dozens of geographically dispersed data centers, diluting the attack.' },
        { q: 'What arrives at the protected origin server from a scrubbing center?', a: 'Only verified, clean, legitimate user traffic.' },
      ],
      summary: 'Upstream scrubbing centers absorb multi-gigabit attacks at the internet edge before they reach host servers.',
    },
    {
      id: 19,
      title: 'Load Balancing, Caching, and Capacity Management',
      definition: 'Capacity management uses reverse proxies, load balancers, and caching to distribute incoming user load across multiple server replicas.',
      explanation: 'A load balancer sits in front of a pool of servers and routes requests evenly among them (e.g., using round-robin). Content Delivery Networks (CDNs) cache static images and HTML pages at the network edge, so servers only process dynamic requests.',
      analogy: 'Opening 10 checkout lines at a supermarket instead of 1, and placing vending machines outside for quick snacks (caching).',
      example: 'Using an Nginx reverse proxy to distribute incoming web traffic across 4 Node.js application containers.',
      diagram: '[Incoming Requests] ──> [Load Balancer] ──┬──> [Web Worker 1]\n                                          ├──> [Web Worker 2]\n                                          └──> [Web Worker 3]',
      keyTerms: ['Load Balancing', 'Reverse Proxy', 'CDN Caching', 'Horizontal Scaling', 'High Availability'],
      qna: [
        { q: 'What is the role of a network load balancer?', a: 'To distribute incoming network traffic across multiple backend servers to prevent single points of overload.' },
        { q: 'How does edge caching reduce server load?', a: 'By serving static content directly from edge servers without querying the origin database.' },
        { q: 'Can load balancing alone protect a server from an infinite botnet flood?', a: 'No; scaling servers indefinitely is cost-prohibitive and botnet volume can easily outpace autoscaling budgets.' },
      ],
      summary: 'Load balancing and caching absorb traffic surges by distributing work across server pools.',
    },
    {
      id: 20,
      title: 'Comparing Defense Techniques and Their Limitations',
      definition: 'Every cybersecurity defense has trade-offs: no single technique stops all attacks without drawbacks.',
      explanation: 'Rate limiting may drop legitimate users during rushes; firewalls can be bypassed if attacks use legitimate application ports; scrubbing centers add financial cost; and load balancing cannot withstand massive botnet floods. A layered defense combines all four.',
      analogy: 'A castle uses a moat, high stone walls, archers, and an iron portcullis. If one barrier is breached, the others still protect the stronghold.',
      example: 'Pairing Cloudflare upstream scrubbing (for bandwidth) with local iptables rate-limiting (for host CPU) and a WAF (for web queries).',
      diagram: '+---------------------------------------------------------+\n| LAYERED DEFENSE STACK:                                  |\n| [Edge]     Anycast Scrubbing  --> Stops bandwidth floods|\n| [Network]  Firewall Filtering --> Drops invalid protocols|\n| [Host]     Rate Limiting      --> Protects CPU interrupts|\n| [App]      WAF & Caching      --> Protects databases     |\n+---------------------------------------------------------+',
      keyTerms: ['Defense in Depth', 'Trade-offs', 'False Positives', 'Layered Security'],
      qna: [
        { q: 'What is Defense-in-Depth?', a: 'A strategy that employs multiple layers of security controls throughout an IT infrastructure.' },
        { q: 'What is the main limitation of host-based firewall filtering?', a: 'It does not protect against physical bandwidth saturation upstream from the host.' },
        { q: 'What is the danger of setting rate limits too aggressively?', a: 'Legitimate users might be blocked or experience dropped requests during normal traffic peaks.' },
      ],
      summary: 'Defense-in-depth combines multiple complementary security controls to counter individual defense weaknesses.',
    },
    {
      id: 21,
      title: 'Practical Interpretation of the Live Demonstration',
      definition: 'Understanding the cause-and-effect relationship between attack launch, telemetry changes, and mitigation recovery in the VLab dashboard.',
      explanation: 'In the live demo, starting the lab establishes a healthy baseline (0-2 PPS, 0-2% CPU). Launching a flood spikes PPS to 35,000+ and CPU to 28%+, shifting the health badge to CRITICAL (DoS). Applying mitigation engages iptables rules, dropping 99.9% of packets and restoring health to HEALTHY.',
      analogy: 'Looking at a patient’s vital signs monitor before, during, and after administering medicine.',
      example: 'Correlating the yellow flood event line on the real-time canvas chart with the instant rise in CPU load.',
      diagram: '[Start Lab] -> HEALTHY -> [Launch Flood] -> CRITICAL (DoS) -> [Apply Mitigation] -> HEALTHY Restored',
      keyTerms: ['Live Demonstration', 'Telemetry Correlation', 'Event Annotation', 'Mitigation Efficacy'],
      qna: [
        { q: 'What does the yellow event marker on the telemetry canvas represent?', a: 'The exact timestamp when an ICMP flood attack was launched.' },
        { q: 'What does the green event marker on the telemetry canvas represent?', a: 'The exact timestamp when a mitigation defense was activated.' },
        { q: 'Why does CPU load return to baseline after applying rate-limit mitigation?', a: 'Because the Linux kernel drops excess packets immediately without generating Echo Replies.' },
      ],
      summary: 'Observing real-time telemetry reinforces theoretical knowledge with practical visual evidence.',
    },
    {
      id: 22,
      title: 'Ethical Cybersecurity Experimentation and Lab Safety',
      definition: 'Ethical hacking mandates that testing and attacks must only be executed against systems you own or have explicit written authorization to test.',
      explanation: 'Launching denial-of-service floods against public websites, campus networks, or third-party servers is a serious crime under laws like the Computer Fraud and Abuse Act (CFAA) and equivalent international statutes. Educational labs use isolated Docker containers to guarantee complete legal safety.',
      analogy: 'Medical students practice surgery on simulated mannequins or cadavers, never on healthy pedestrians on the street.',
      example: 'Restricting all attack tools in VLab to the isolated `com.vlab.managed` Docker bridge network with automated shutdown timers.',
      diagram: '[Safe Lab Environment]  <=== ISOLATION WALL ===>  [Public Internet (NEVER ATTACK!)]',
      keyTerms: ['Ethics', 'Authorization', 'CFAA', 'Isolation', 'Safe Sandbox'],
      qna: [
        { q: 'Why is launching a flood attack against a public website illegal?', a: 'Because it disrupts systems without authorization and violates computer misuse laws.' },
        { q: 'How does VLab guarantee safety during attack simulations?', a: 'By isolating traffic inside a private Docker bridge network and enforcing bounded execution timers.' },
        { q: 'What is required before conducting penetration testing against an enterprise?', a: 'Explicit, written legal authorization defining rules of engagement.' },
      ],
      summary: 'Responsible cybersecurity practitioners only experiment within authorized, isolated sandbox environments.',
    },
    {
      id: 23,
      title: 'The Relationship Between Cryptography and Availability',
      definition: 'Cryptography protects Confidentiality and Integrity, but does NOT protect against Availability attacks like resource floods.',
      explanation: 'A fundamental misunderstanding among beginner students is assuming that encryption (like HTTPS or AES) prevents all cyberattacks. Encryption scrambles data so snoops cannot read it. However, if an attacker floods a server with 1,000,000 encrypted requests, the server must work even harder to decrypt each one! Floods bypass cryptography entirely by exhausting system availability.',
      analogy: 'Writing a letter in an unbreakable secret code. It prevents the mail carrier from reading your secrets (Confidentiality). But if someone dumps 50,000 coded letters in your mailbox, your mailbox still overflows and breaks (Availability).',
      example: 'An HTTPS flood consumes 15x more server CPU than a plaintext HTTP flood because TLS cryptographic handshakes require intense math.',
      diagram: '+--------------------------------------------------------+\n| CRYPTOGRAPHY vs FLOOD ATTACKS:                         |\n| [Encryption / HTTPS]  --> Protects CONFIDENTIALITY     |\n| [Digital Signatures]  --> Protects INTEGRITY           |\n| [Defensive Architecture] --> Protects AVAILABILITY (Floods) |\n+--------------------------------------------------------+',
      keyTerms: ['Cryptography', 'Encryption', 'Confidentiality vs Availability', 'TLS Handshake Overhead'],
      qna: [
        { q: 'Does encrypting web traffic with HTTPS stop a flood attack?', a: 'No. The server still has to process the connection, and TLS decryption increases CPU load.' },
        { q: 'Which pillar of the CIA triad does cryptography primarily protect?', a: 'Confidentiality and Integrity.' },
        { q: 'Why can encrypted floods be more damaging to a server than unencrypted ones?', a: 'Because performing cryptographic handshakes requires heavy mathematical CPU processing.' },
      ],
      summary: 'Cryptography secures confidentiality and integrity; defensive network architecture secures availability.',
    },
    {
      id: 24,
      title: 'Common Exam Questions and Misconceptions',
      definition: 'A targeted review of the most frequently tested concepts and student misconceptions in computer networking and cybersecurity exams.',
      explanation: 'Examiners often test edge cases: the difference between DoS and DDoS, why ping uses ICMP, why rate limiting is preferred over total blocking, and why encryption cannot prevent availability exhaustion.',
      analogy: 'Reviewing past exam answer keys before entering the testing hall.',
      example: 'Correcting the misconception that "ping uses TCP Port 7" (Ping uses ICMP, which does not have port numbers!).',
      diagram: '[Exam Trap: "Ping uses TCP?"] ──> WRONG! Ping uses ICMP (Layer 3, No Port Numbers)',
      keyTerms: ['Exam Prep', 'Misconceptions', 'Review', 'Model Answers'],
      qna: [
        { q: 'Do ICMP packets contain TCP or UDP port numbers?', a: 'No. ICMP operates directly over IP at Layer 3 and uses Type and Code fields instead of ports.' },
        { q: 'Is high traffic volume alone sufficient proof of a malicious attack?', a: 'No. It could be a legitimate flash crowd (e.g. ticket sales or exam results).' },
        { q: 'Why is ICMP Echo Reply Type 0 and not Type 8?', a: 'Type 8 is the Request; Type 0 is the Reply, as standardized in RFC 792.' },
      ],
      summary: 'Mastering key definitions, protocol layers, and common misconceptions ensures high exam performance.',
    },
    {
      id: 25,
      title: 'Final Revision Summary',
      definition: 'A comprehensive capstone summary connecting all 24 chapters into an integrated cybersecurity mental model.',
      explanation: 'Cybersecurity protects the CIA Triad. Flood attacks threaten Availability by targeting physical bandwidth, PPS, CPU, or memory queues. Protocols like ICMP can be weaponized into floods. Defense requires layered strategies: rate limiting, firewalls, and upstream scrubbing.',
      analogy: 'The final aerial view of the entire cybersecurity landscape before setting out on your engineering career.',
      example: 'Synthesizing knowledge from VLab’s live simulation to design an enterprise-grade DDoS resilience plan.',
      diagram: '[CIA Triad: Availability] ──> [Flood Threat] ──> [Telemetry Detection] ──> [Layered Defense]',
      keyTerms: ['Capstone', 'Integrated Defense', 'Cybersecurity Engineer', 'Resilience'],
      qna: [
        { q: 'What is the golden rule of flood defense?', a: 'Employ layered defense-in-depth: absorb volume upstream and enforce rate limits locally.' },
        { q: 'What is the primary indicator of an ICMP flood in server metrics?', a: 'A sudden, massive spike in ICMP PPS accompanied by high CPU utilization.' },
        { q: 'What should be the first step when an incident occurs?', a: 'Validate telemetry against baselines to verify whether the spike is malicious or a flash crowd.' },
      ],
      summary: 'Cybersecurity availability engineering combines rigorous monitoring, protocol knowledge, and layered defense.',
    },
  ],

  // =========================================================================
  // 3. LAST-MINUTE REVISION: 15 DEFINITIONS, TABLES, AND FLASHCARDS
  // =========================================================================
  revisionDefinitions: [
    { term: 'Flood Attack', def: 'A brute-force denial-of-service attack that overwhelms a target server with excessive network traffic.' },
    { term: 'DoS', def: 'Denial of Service; an attack originating from a single device targeting system availability.' },
    { term: 'DDoS', def: 'Distributed Denial of Service; an attack originating from many distributed compromised devices (botnets).' },
    { term: 'ICMP', def: 'Internet Control Message Protocol; a Layer 3 diagnostic and error-reporting protocol used by ping.' },
    { term: 'Echo Request', def: 'An ICMP Type 8 message sent to test if a remote computer is reachable and active.' },
    { term: 'Echo Reply', def: 'An ICMP Type 0 response sent by a host confirming it received an Echo Request.' },
    { term: 'PPS', def: 'Packets Per Second; the rate of packet arrival that directly strains CPU kernel interrupt handlers.' },
    { term: 'Bandwidth', def: 'The maximum data transmission capacity of a network connection, measured in Mbps or Gbps.' },
    { term: 'Latency', def: 'The round-trip time required for a packet to travel from sender to destination and return, in ms.' },
    { term: 'Packet Loss', def: 'The percentage of transmitted packets that fail to arrive because queues or buffers overflow.' },
    { term: 'Rate Limiting', def: 'A defensive policy restricting the number of requests allowed within a specific time interval.' },
    { term: 'Firewall', def: 'A security barrier that monitors and filters network traffic according to predefined security rules.' },
    { term: 'Availability', def: 'The pillar of the CIA Triad guaranteeing that systems are reachable and operational for authorized users.' },
    { term: 'Traffic Scrubbing', def: 'Routing traffic through upstream cloud filtering centers to strip out malicious packets before the origin server.' },
    { term: 'Load Balancing', def: 'Distributing incoming traffic evenly across a cluster of backend servers to prevent individual bottlenecks.' },
  ],

  revisionFlashcards: [
    { q: 'Which pillar of the CIA triad is targeted by flood attacks?', a: 'Availability. Flood attacks do not steal secrets (Confidentiality) or alter data (Integrity); they shut down access.' },
    { q: 'What ICMP types are used for Echo Request and Echo Reply?', a: 'Echo Request is Type 8. Echo Reply is Type 0.' },
    { q: 'What does PPS stand for and why does it matter?', a: 'Packets Per Second. High PPS forces the CPU to constantly process hardware interrupts, locking up the machine.' },
    { q: 'Does an IP address or an ICMP message contain port numbers?', a: 'No! IP addresses locate machines; ICMP operates at Layer 3 without port numbers. Port numbers belong to TCP/UDP (Layer 4).' },
    { q: 'Why is a DDoS attack harder to stop than a DoS attack?', a: 'Because DDoS traffic originates from thousands of diverse IP addresses (a botnet), so blocking a single IP is ineffective.' },
    { q: 'What state does a TCP SYN flood leave on the server?', a: 'Half-open connections. The server allocates memory for the handshake and waits for an ACK that never arrives.' },
    { q: 'Does encrypting your website with HTTPS stop flood attacks?', a: 'No! Encryption protects Confidentiality. Processing cryptographic handshakes actually increases server CPU strain during a flood.' },
    { q: 'What is the everyday analogy for an ICMP flood?', a: 'Repeatedly ringing an office doorbell hundreds of times so the staff cannot help genuine students.' },
    { q: 'What is the everyday analogy for rate limiting?', a: 'A receptionist turnstile that allows only 1 person through every 2 seconds, no matter how many are waiting.' },
    { q: 'What is the difference between a flash crowd and a DDoS attack?', a: 'A flash crowd consists of real human users with diverse IPs and full browser behavior. A DDoS is automated bot traffic.' },
    { q: 'What does iptables `--limit 1/s --limit-burst 5` do?', a: 'Allows an initial burst of 5 packets, then restricts incoming packets to a strict rate of 1 packet per second.' },
    { q: 'What is traffic scrubbing?', a: 'Diverting traffic through cloud cleaning centers (like Cloudflare) to remove attack packets before they reach your server.' },
    { q: 'Can a local firewall stop a 50 Gbps flood hitting a 1 Gbps cable?', a: 'No. The physical cable will saturate upstream at the ISP level before packets even reach the local firewall.' },
    { q: 'What tool did we use in the VLab container to launch the flood?', a: 'hping3 (using `hping3 --icmp --flood target`).' },
    { q: 'What is the golden rule of cybersecurity lab safety?', a: 'Never attack systems you do not own. Always test in isolated sandboxes like VLab.' },
  ],

  // =========================================================================
  // 4. QUIZ ENGINE: EASY, MODERATE, AND DIFFICULT LEVELS (10 QUESTIONS EACH)
  // =========================================================================
  quizzes: {
    easy: [
      {
        id: 1,
        topic: 'Definition of a Flood Attack',
        question: 'What is the primary definition and goal of a flood attack in cybersecurity?',
        options: [
          'Secretly decrypting stored user passwords in database tables',
          'Overwhelming a target system with excessive traffic so legitimate users cannot access it',
          'Infecting hardware with physical biological viruses',
          'Altering financial ledgers without user permission',
        ],
        correct: 1,
        points: 1,
        hint: 'Think about whether the attacker wants to steal secrets or exhaust system processing capacity.',
        explanation: 'A flood attack aims to cause denial-of-service by bombarding a target with an overwhelming volume of packets, saturating bandwidth and exhausting CPU/memory.',
        distractors: [
          'Decrypting passwords is a cryptographic attack against Confidentiality, not a flood attack.',
          'Computer attacks are digital software/network events, not biological infections.',
          'Tampering with financial records is an Integrity attack, whereas floods target Availability.',
        ],
      },
      {
        id: 2,
        topic: 'Meaning of ICMP',
        question: 'What does the acronym ICMP stand for, and what is its primary function in networking?',
        options: [
          'Internal Computer Management Protocol — for local printer sharing',
          'Internet Control Message Protocol — for network diagnostics and error reporting',
          'Integrated Cyber Mitigation Process — for automatic firewall blocking',
          'Interactive Communication Media Protocol — for streaming video calls',
        ],
        correct: 1,
        points: 1,
        hint: 'It is the core Layer 3 helper protocol used by network devices to send status messages like Destination Unreachable.',
        explanation: 'RFC 792 defines ICMP (Internet Control Message Protocol) as a fundamental network-layer protocol used for diagnostics, testing, and error reporting between IP hosts.',
        distractors: [
          'ICMP is an internet-wide IP protocol, not an internal printer management protocol.',
          'ICMP communicates network control status; it is not a defensive mitigation product.',
          'Video streaming uses application protocols over UDP, not ICMP.',
        ],
      },
      {
        id: 3,
        topic: 'Purpose of Ping',
        question: 'What is the primary operational purpose of the command-line network utility "ping"?',
        options: [
          'Testing whether a remote host is reachable and measuring round-trip latency',
          'Encrypting web traffic between a browser and an online store',
          'Installing missing software drivers on the operating system',
          'Downloading large media files at maximum line speed',
        ],
        correct: 0,
        points: 1,
        hint: 'Ping sends Echo Requests (Type 8) and listens for Echo Replies (Type 0).',
        explanation: 'The `ping` utility sends ICMP Echo Requests to verify whether a remote IP host is active and responsive, while measuring round-trip transit time in milliseconds.',
        distractors: [
          'Traffic encryption is performed by TLS/HTTPS, not ping.',
          'Driver installation is managed by the OS package manager, not network diagnostics.',
          'Ping is a lightweight diagnostic probe, not a file transfer protocol.',
        ],
      },
      {
        id: 4,
        topic: 'Packets and IP Addresses',
        question: 'How do network packets and IP addresses work together when transmitting data across the Internet?',
        options: [
          'IP addresses store files, while packets are the physical copper cables connecting computers',
          'Data is divided into packets, and IP addresses in the packet header guide routers to the destination',
          'IP addresses automatically erase corrupted packets before transmission begins',
          'Packets can only travel between computers that share the identical IP address',
        ],
        correct: 1,
        points: 1,
        hint: 'Think of an envelope (packet) carrying a letter, with the sender and recipient addresses (IPs) stamped on the outside.',
        explanation: 'Data is segmented into discrete units called packets. Each packet header contains source and destination IP addresses so intermediate routers can forward it across network hops.',
        distractors: [
          'IP addresses are numerical network identifiers, not storage media.',
          'Corrupted packet detection is handled by checksums, not IP addresses.',
          'Every device on the same local network must have a unique IP address to avoid IP conflicts.',
        ],
      },
      {
        id: 5,
        topic: 'Meaning of PPS',
        question: 'What does the metric "PPS" stand for in network monitoring and flood attack telemetry?',
        options: [
          'Programs Per Server — the count of running background apps',
          'Packets Per Second — the arrival rate of network packet envelopes',
          'Protocols Per Segment — the diversity of active protocols',
          'Pings Per System — the number of ping commands executed',
        ],
        correct: 1,
        points: 1,
        hint: 'It measures rate: how many packet chunks arrive at the network card every second.',
        explanation: 'PPS stands for Packets Per Second. It measures network throughput by count of packets rather than volume of bytes, and is crucial because high PPS stresses CPU interrupts regardless of packet size.',
        distractors: [
          'Running programs are measured as processes, not PPS.',
          'Protocols are standardized communication rules, not a per-second arrival rate.',
          'Ping is just one application of ICMP; PPS encompasses all packet types across all protocols.',
        ],
      },
      {
        id: 6,
        topic: 'Meaning of DoS',
        question: 'What does "DoS" stand for in cybersecurity, and what condition does it describe?',
        options: [
          'Disk Operating System — a legacy personal computer system',
          'Denial of Service — making a system or service unavailable to authorized users',
          'Domain of Security — a cryptographic security boundary',
          'Delivery of Storage — a cloud backup mechanism',
        ],
        correct: 1,
        points: 1,
        hint: 'The attacker denies legitimate users from accessing the service.',
        explanation: 'DoS stands for Denial of Service. It occurs when an attacker exhausts finite computational, memory, or bandwidth resources so legitimate users cannot access the system.',
        distractors: [
          'Disk Operating System (MS-DOS) is a historic PC operating system, not a security attack.',
          'Domain of Security is an informal phrase, not the technical definition of DoS.',
          'Cloud storage delivery refers to file synchronization, not an availability outage.',
        ],
      },
      {
        id: 7,
        topic: 'Difference between DoS and DDoS',
        question: 'What is the fundamental difference between a DoS attack and a DDoS attack?',
        options: [
          'DoS targets physical hardware, while DDoS targets software applications',
          'DoS originates from a single attack machine; DDoS coordinates multiple distributed systems (botnet)',
          'DoS is illegal, whereas DDoS is completely legal and permissible',
          'DDoS only works over Wi-Fi, while DoS only works over wired connections',
        ],
        correct: 1,
        points: 1,
        hint: 'The extra "D" stands for Distributed.',
        explanation: 'A DoS attack originates from a single machine or single IP. A Distributed Denial of Service (DDoS) leverages a botnet of hundreds or thousands of compromised machines distributed globally, making IP-based blocking far harder.',
        distractors: [
          'Both DoS and DDoS can target any layer from network infrastructure to web applications.',
          'Both unauthorized DoS and DDoS attacks are illegal cybercrimes under global computer fraud statutes.',
          'Both attacks operate across all physical transmission mediums (fiber, copper, wireless).',
        ],
      },
      {
        id: 8,
        topic: 'Meaning of Availability',
        question: 'In the foundational CIA Triad, what is the exact definition of "Availability"?',
        options: [
          'Guaranteeing that secret data cannot be observed by unauthorized eavesdroppers',
          'Ensuring that data has not been modified or corrupted in transit',
          'Ensuring that systems, services, and data are accessible to authorized users when needed',
          'Verifying that software licenses are up to date and legally registered',
        ],
        correct: 2,
        points: 1,
        hint: 'Availability answers: "Can the authorized user actually connect and use the system right now?"',
        explanation: 'Availability ensures timely and dependable access to information and services for authorized entities. Flood attacks directly violate Availability while leaving Confidentiality and Integrity intact.',
        distractors: [
          'Preventing eavesdropping is Confidentiality.',
          'Preventing unauthorized modification is Integrity.',
          'Software license management is administrative compliance, not a CIA triad security pillar.',
        ],
      },
      {
        id: 9,
        topic: 'Purpose of Rate Limiting',
        question: 'What is the primary function and purpose of applying a rate-limiting defense?',
        options: [
          'Restricting incoming traffic to a safe threshold, dropping or delaying excess packets beyond the limit',
          'Permanently terminating the web server process whenever traffic increases',
          'Charging visitors a monetary fee whenever they load a web page',
          'Deleting customer accounts that submit more than two requests per week',
        ],
        correct: 0,
        points: 1,
        hint: 'Think of a turnstile or bouncer letting in only 1 person per second.',
        explanation: 'Rate limiting constrains the frequency of incoming requests or packets (e.g. 1/sec with a burst of 5). Normal traffic is processed, while excessive bursts are discarded before consuming server CPU.',
        distractors: [
          'Terminating the server would fulfill the attacker\'s goal of denying service.',
          'Rate limiting is a technical security threshold, not a billing paywall.',
          'Account deletion is destructive and does not protect network availability.',
        ],
      },
      {
        id: 10,
        topic: 'Safe Lab Practices',
        question: 'Which of the following represents an ethical, safe cybersecurity lab practice?',
        options: [
          'Testing high-volume attack tools against public college portals without authorization',
          'Restricting simulations to isolated local containers (such as Docker sandboxes) on private virtual networks',
          'Flooding a classmate\'s personal smartphone as a practical joke',
          'Publishing active attack stresser scripts to public message boards',
        ],
        correct: 1,
        points: 1,
        hint: 'Ethical testing must always be contained so that zero third-party users or public services can be affected.',
        explanation: 'Safe cybersecurity education requires isolated sandbox environments (such as Docker bridge networks). Traffic is strictly contained locally and cannot leak into external networks or disrupt public services.',
        distractors: [
          'Attacking a college portal without explicit authorization is a federal crime.',
          'Targeting personal devices causes real disruption and violates ethical guidelines.',
          'Distributing weaponized stresser scripts promotes unauthorized malicious activity.',
        ],
      },
    ],

    moderate: [
      {
        id: 1,
        topic: 'Identifying ICMP Flood Scenario',
        question: 'A live dashboard shows ICMP Echo Requests surging from 2 PPS to 35,000 PPS with CPU load jumping to 90%, while HTTP web requests remain constant. What attack is occurring?',
        options: [
          'SQL Injection vulnerability exploitation',
          'ICMP Flood (Ping Flood) saturating the network stack',
          'Cross-Site Scripting (XSS) in user browser forms',
          'Ransomware encrypting backend storage volumes',
        ],
        correct: 1,
        points: 2,
        hint: 'Observe that the traffic surge is exclusively ICMP packets (pings) and CPU load, not database queries.',
        explanation: 'A sudden, massive surge in ICMP Echo Requests paired with elevated host CPU usage while application-layer HTTP traffic is calm is the textbook signature of an ICMP Flood DoS attack.',
        distractors: [
          'SQL Injection targets relational database queries via input forms, not raw ICMP packet floods.',
          'XSS executes malicious JavaScript inside victim browsers, which does not alter ICMP telemetry.',
          'Ransomware encrypts disk files and consumes disk I/O, not network ICMP packets.',
        ],
      },
      {
        id: 2,
        topic: 'Interpreting Packet-Rate Changes',
        question: 'Telemetry indicates PPS jumped from 50 to 90,000 PPS in 2 seconds, accompanied by a sharp spike in dropped packets at the network interface. How should this be interpreted?',
        options: [
          'The server power supply has failed',
          'A volumetric packet burst has overwhelmed the interface ring buffers faster than the kernel can drain them',
          'The system administrator changed their login password',
          'The computer has run out of available hard drive storage',
        ],
        correct: 1,
        points: 2,
        hint: 'Ring buffers fill up when packets arrive faster than the operating system CPU can process them.',
        explanation: 'When packet arrival rate dramatically exceeds the network card\'s ring buffer capacity and CPU interrupt handling capability, the NIC is forced to drop arriving packets, indicating a severe volumetric surge.',
        distractors: [
          'A power supply failure would shut down the machine and drop PPS to 0 immediately.',
          'Changing an administrator password does not generate incoming network packet surges.',
          'Ring buffer packet drops occur in RAM and kernel memory, completely independent of disk storage space.',
        ],
      },
      {
        id: 3,
        topic: 'Understanding CPU Utilization',
        question: 'Why does a flood of tiny 64-byte packets cause 100% CPU utilization even when total network bandwidth (Mbps) is relatively low?',
        options: [
          'Each individual packet triggers a kernel hardware interrupt (SoftIRQ), monopolizing CPU cycles just to process headers',
          'Small packets generate extreme heat inside modern CPU heat sinks',
          'The operating system must convert small packets into graphical images before reading them',
          'Small packets cannot be stored in RAM and must be written directly to optical discs',
        ],
        correct: 0,
        points: 2,
        hint: 'Think about overhead: handling 1,000,000 tiny envelopes requires 1,000,000 separate sorting actions by the CPU.',
        explanation: 'Every arriving packet triggers an interrupt request (IRQ) and subsequent SoftIRQ processing in the Linux kernel. A flood of thousands of tiny packets generates thousands of interrupts per second, starving user applications of CPU time.',
        distractors: [
          'Electrical heat generation is a thermal byproduct, not the architectural reason CPU cycles are consumed.',
          'Network packets are processed as raw byte streams, never converted into graphical images.',
          'Packets are buffered in kernel sk_buff structures in RAM, not written to optical discs.',
        ],
      },
      {
        id: 4,
        topic: 'Distinguishing Latency from Bandwidth',
        question: 'How do network latency and network bandwidth differ conceptually, and how are they affected by a flood attack?',
        options: [
          'Latency is total pipe capacity; bandwidth is the time delay for a packet to travel round-trip',
          'Bandwidth is the maximum data transfer capacity per second; latency is the time delay required for data to travel round-trip',
          'Latency only exists on fiber optics, while bandwidth only exists on Wi-Fi',
          'They are exact synonyms for the same physical cable measurement',
        ],
        correct: 1,
        points: 2,
        hint: 'Bandwidth is how wide the highway is; latency is how fast cars can drive from point A to point B.',
        explanation: 'Bandwidth measures throughput capacity (e.g. 1 Gbps). Latency measures transit delay (e.g. 25ms). A flood attack saturates bandwidth, which creates queuing delays that cause latency to skyrocket (e.g. from 20ms to 4,000ms).',
        distractors: [
          'This reverses the two definitions.',
          'Both latency and bandwidth apply across all network technologies and physical media.',
          'Latency and bandwidth are fundamentally distinct dimensional metrics.',
        ],
      },
      {
        id: 5,
        topic: 'Recognizing SYN Flood Scenario',
        question: 'A network analyst inspects server connections and finds thousands of TCP sockets stuck in the `SYN_RECV` state without completing the handshake. What attack is taking place?',
        options: [
          'DNS cache poisoning attack',
          'TCP SYN Flood exploiting the three-way handshake and exhausting connection backlogs',
          'BGP route hijacking attack',
          'Cross-Site Request Forgery (CSRF)',
        ],
        correct: 1,
        points: 2,
        hint: 'The attacker sends SYN packets but never returns the final ACK, leaving connections half-open.',
        explanation: 'In a TCP SYN flood, the attacker sends thousands of TCP SYN requests with spoofed IPs. The server allocates memory and replies with SYN-ACK, but the attacker never sends the final ACK. The backlog queue fills up, denying legitimate TCP handshakes.',
        distractors: [
          'DNS cache poisoning corrupts domain-to-IP lookup tables in DNS resolvers.',
          'BGP hijacking alters internet routing paths between autonomous systems.',
          'CSRF tricks an authenticated user\'s browser into executing unauthorized web actions.',
        ],
      },
      {
        id: 6,
        topic: 'Understanding UDP Flooding',
        question: 'Why are UDP floods particularly common and dangerous compared to TCP-based attacks?',
        options: [
          'UDP is connectionless and requires no initial handshake, allowing attackers to fire spoofed packets at full line speed',
          'UDP packets automatically bypass all host and cloud firewalls without inspection',
          'UDP contains built-in cryptographic backdoors that grant root access',
          'UDP packets cannot be dropped by routers under any circumstances',
        ],
        correct: 0,
        points: 2,
        hint: 'Because UDP doesn\'t wait for a response, the attacker can spoof any source IP and blast packets continuously.',
        explanation: 'Because UDP has no state or handshake, attackers can forge (spoof) source IP addresses easily and blast packets without maintaining connection state. The victim expends CPU inspecting ports and generating ICMP Port Unreachable replies.',
        distractors: [
          'Firewalls inspect UDP headers, ports, and state just like any other Layer 4 protocol.',
          'UDP has no relationship with encryption or backdoors; it is a standard transport protocol.',
          'Routers routinely drop UDP packets when interface queues overflow.',
        ],
      },
      {
        id: 7,
        topic: 'Identifying HTTP Flood Scenario',
        question: 'Web server access logs show 60,000 HTTP GET requests per second targeting the database search endpoint `/search?keyword=...`, causing HTTP 504 timeouts. What scenario is this?',
        options: [
          'Layer 3 ICMP echo flood',
          'Layer 7 HTTP Application Flood targeting computational search endpoints',
          'Physical fiber optic cable break',
          'Man-in-the-Middle Wi-Fi eavesdropping',
        ],
        correct: 1,
        points: 2,
        hint: 'The attack is happening at the application layer (HTTP) and forcing heavy database search queries.',
        explanation: 'An HTTP Flood is a Layer 7 attack. Because complex search queries require heavy database and CPU processing, flooding this endpoint exhausts backend worker pools even with moderate network bandwidth.',
        distractors: [
          'ICMP floods operate at Layer 3 and do not generate HTTP GET requests in web server access logs.',
          'A severed fiber cable would halt all incoming traffic rather than generate 60,000 HTTP requests per second.',
          'Wi-Fi eavesdropping captures traffic passively and does not flood web search endpoints.',
        ],
      },
      {
        id: 8,
        topic: 'Choosing Suitable Firewall Rule',
        question: 'To mitigate an active ICMP flood on a Linux host while still permitting reasonable network diagnostics, which firewall rule configuration is appropriate?',
        options: [
          'Flush all firewall rules and disable packet filtering (`iptables -F`)',
          'Apply an iptables rate-limit rule: accept ICMP echo-requests with `--limit 1/s --limit-burst 5`, then drop excess',
          'Delete the operating system networking stack configuration (`rm -rf /etc/network`)',
          'Block all outgoing HTTP web traffic on port 80 and 443',
        ],
        correct: 1,
        points: 2,
        hint: 'Use the iptables limit match extension to allow diagnostic pings while discarding flood volume.',
        explanation: 'The rule `iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 5 -j ACCEPT` paired with an ICMP DROP rule permits diagnostic pings while immediately discarding excess flood packets in the kernel.',
        distractors: [
          'Flushing rules disables all defense and allows the flood to overwhelm the machine unimpeded.',
          'Deleting network configuration destroys system functionality and causes total self-inflicted downtime.',
          'Blocking outgoing web ports prevents normal websites from operating without addressing the incoming ICMP flood.',
        ],
      },
      {
        id: 9,
        topic: 'Traffic Spikes and False Positives',
        question: 'A college exam portal sees traffic surge by 800% at 9:00 AM on final exam day. How should security defenses distinguish this legitimate spike from a flood attack?',
        options: [
          'Assume all traffic is an attack and immediately block every visiting IP address',
          'Verify browser session tokens, CAPTCHA/JavaScript challenges, and expected student portal access flows vs repetitive non-browser bot packets',
          'Power down the university server room until the exam day is over',
          'Delete student registration records for all students who attempt to connect',
        ],
        correct: 1,
        points: 2,
        hint: 'Legitimate students use real web browsers, have valid sessions, and request images/CSS along with web pages.',
        explanation: 'Legitimate traffic spikes (flash crowds) involve real users using interactive browsers with human behavior, cookies, and asset loading. Defenses like WAF challenges and session verification separate authentic users from automated flood bots without blocking students.',
        distractors: [
          'Blocking all IPs produces catastrophic false positives, failing the entire student cohort.',
          'Powering down the servers achieves the exact denial-of-service outcome the college seeks to avoid.',
          'Deleting student records violates data integrity and causes irreparable harm.',
        ],
      },
      {
        id: 10,
        topic: 'Comparing Metrics Before and After Mitigation',
        question: 'Following the activation of kernel rate-limiting during an ICMP flood simulation, what telemetry change indicates successful defense?',
        options: [
          'CPU utilization drops from ~90% back to baseline (<10%) and accepted PPS drops to configured safe rate',
          'Bandwidth increases to infinity and the server automatically restarts',
          'The target IP address is permanently deleted from the internet',
          'CPU utilization rises to 100% and remains locked there permanently',
        ],
        correct: 0,
        points: 2,
        hint: 'When mitigation succeeds, server resources recover and CPU drops back to a healthy state.',
        explanation: 'Successful mitigation is proven when the target CPU utilization plummets from near-exhaustion back to healthy baseline levels (under 10%) while incoming flood packets are discarded early in the kernel without consuming application resources.',
        distractors: [
          'Bandwidth cannot reach infinity and servers should not restart upon applying firewall rules.',
          'IP addresses are routing coordinates; applying a local filter does not delete IP addresses from the global internet.',
          'If CPU remained locked at 100%, the mitigation would have failed to stop resource exhaustion.',
        ],
      },
    ],

    difficult: [
      {
        id: 1,
        topic: 'Analyzing Telemetry Signals',
        question: 'A network engineer observes: Ingress link utilization is at 99%, host CPU utilization is only 4%, and legitimate external users report 85% packet loss. What root problem does this indicate?',
        options: [
          'Host CPU exhaustion caused by heavy database computation',
          'Bandwidth saturation at the upstream network pipe, dropping packets before they reach the host CPU',
          'Database memory corruption caused by outdated drivers',
          'Faulty physical power supply inside the server chassis',
        ],
        correct: 1,
        points: 3,
        hint: 'Notice that host CPU is completely idle (4%), but the incoming network pipe is 99% full.',
        explanation: 'When link bandwidth is saturated upstream (e.g. at the ISP or router), packets are dropped in transit before ever reaching the host interface. Because packets never reach the host, the host CPU remains idle at 4% while users experience extreme packet loss.',
        distractors: [
          'If CPU exhaustion were the cause, host CPU would be at or near 100%, not 4%.',
          'Database memory issues affect query response times and application logs, not external link bandwidth saturation.',
          'A hardware power supply issue would cause system power loss, not selective 99% network pipe saturation.',
        ],
      },
      {
        id: 2,
        topic: 'Bandwidth Saturation vs CPU Exhaustion',
        question: 'How does the required defense strategy differ between upstream bandwidth saturation and host-level CPU exhaustion?',
        options: [
          'Host iptables rules solve upstream bandwidth saturation; cloud scrubbing is needed for CPU exhaustion',
          'Upstream cloud scrubbing / ISP BGP Flowspec is required for bandwidth saturation; host-level rate limiting / SYN cookies can resolve CPU exhaustion',
          'Both require upgrading RAM chips on the local motherboard',
          'Neither can be resolved; denial of service is irreversible in modern networks',
        ],
        correct: 1,
        points: 3,
        hint: 'A host firewall cannot filter packets that are already clogging the physical fiber cable miles away.',
        explanation: 'If a 1 Gbps physical line receives 40 Gbps of traffic, local host firewalls are helpless because the pipe is saturated upstream; only upstream cloud scrubbing (Anycast) or ISP filtering can absorb it. Conversely, if a host CPU is overwhelmed by 50,000 PPS on a clean line, local kernel rate limits and SYN cookies can resolve it.',
        distractors: [
          'This reverses the roles; host rules cannot prevent upstream line saturation.',
          'Hardware RAM upgrades do not increase physical external ISP pipe capacity.',
          'Modern network architectures routinely mitigate multi-terabit volumetric attacks using Anycast scrubbing.',
        ],
      },
      {
        id: 3,
        topic: 'Selecting Layered Defenses',
        question: 'Which architecture provides the most comprehensive layered defense (defense-in-depth) against blended flood attacks?',
        options: [
          'A single on-premises software firewall with a complex admin password',
          'Upstream Anycast BGP scrubbing + Edge Web Application Firewall (WAF) + Host-level kernel rate limiting and connection timeouts',
          'Disabling network logging and monitoring tools to save processor time',
          'Purchasing commercial insurance instead of implementing technical security controls',
        ],
        correct: 1,
        points: 3,
        hint: 'Layered defense protects against volumetric pipe floods, application HTTP floods, and host-level connection floods at different stages.',
        explanation: 'Layered defense-in-depth stops attacks at appropriate tiers: Anycast BGP absorbs large volumetric pipe floods, edge WAFs challenge application Layer 7 HTTP floods, and host kernel filters protect local connection backlogs.',
        distractors: [
          'A single on-premises firewall cannot withstand upstream volumetric line saturation.',
          'Disabling monitoring blinds administrators and prevents incident diagnosis and automated mitigation.',
          'Insurance may reimburse financial losses after an event, but it does not protect active service availability for users.',
        ],
      },
      {
        id: 4,
        topic: 'Evaluating Rate-Limiting Trade-Offs',
        question: 'What is the most significant operational risk when configuring aggressive per-IP rate limiting on a public e-commerce checkout service?',
        options: [
          'The server will consume significantly more electrical energy',
          'Legitimate shoppers sharing corporate NAT proxies, university campuses, or mobile CGNAT will be falsely blocked (false positives)',
          'The web application will automatically lower prices on all items',
          'Google Search will permanently delete the domain registration',
        ],
        correct: 1,
        points: 3,
        hint: 'Many cellular networks and corporate offices route thousands of distinct human users through a single shared public IP address.',
        explanation: 'Under Carrier-Grade NAT (CGNAT) or corporate proxies, hundreds of distinct human buyers share a single public IP. If rate limits are tuned too aggressively, all shoppers sharing that proxy will be blocked together, causing severe false positives and lost revenue.',
        distractors: [
          'Rate limiting in the kernel actually reduces CPU consumption and electrical power draw.',
          'Security rate limiting operates on network packets and cannot alter application database prices.',
          'Rate limiting does not de-register internet domain names.',
        ],
      },
      {
        id: 5,
        topic: 'Analyzing Distributed Traffic Scenario',
        question: 'An attacker deploys a botnet of 300,000 residential IP addresses. Each bot sends only 1 HTTP request every 5 seconds. Why does standard per-IP rate limiting fail against this attack?',
        options: [
          'Because residential IP addresses cannot be viewed by network switches',
          'Because each individual bot operates far below normal per-IP rate-limiting thresholds, yet aggregate volume saturates the server',
          'Because HTTP requests are impossible to count on web servers',
          'Because residential internet providers block all firewalls',
        ],
        correct: 1,
        points: 3,
        hint: '1 request every 5 seconds per IP looks completely innocent to a rule looking for 50 requests/second per IP.',
        explanation: 'In a "low-and-slow" distributed botnet, each individual bot sends requests at a rate indistinguishable from a casual human browsing session. A rule set to trigger at 10 req/sec per IP will never fire, yet 300,000 bots generate 60,000 total requests/sec.',
        distractors: [
          'Every TCP/IP packet contains a fully readable source IP address in its header.',
          'Web servers log and meter HTTP requests routinely via access logs and metrics collectors.',
          'Residential ISPs route standard IP traffic and have no ability to disable remote server firewalls.',
        ],
      },
      {
        id: 6,
        topic: 'Choosing Defenses for HTTP Floods',
        question: 'To mitigate the distributed residential botnet attack described above without blocking legitimate users, which defense mechanism is most effective?',
        options: [
          'Blocking all residential internet service providers globally',
          'Deploying transparent browser challenges (JavaScript proofs of work, TLS fingerprinting, and CAPTCHAs) via an Edge WAF',
          'Disabling HTTPS encryption on the web server completely',
          'Increasing the size of HTML fonts on product pages',
        ],
        correct: 1,
        points: 3,
        hint: 'Attack scripts and headless bots typically fail complex browser JavaScript execution challenges that real browsers pass automatically.',
        explanation: 'Because IP-based blocking fails against residential botnets, edge WAFs inspect client behavior and issue silent cryptographic or JavaScript execution challenges. Real web browsers execute the challenge seamlessly, while automated bot scripts fail and are dropped.',
        distractors: [
          'Blocking residential ISPs would block 95% of genuine human customers and destroy the business.',
          'Disabling HTTPS does not reduce request volume and dangerously exposes user passwords.',
          'Altering font sizes has zero effect on network protocols and web server request handling.',
        ],
      },
      {
        id: 7,
        topic: 'Legitimate Spikes vs Suspicious Traffic',
        question: 'During a flash news event, traffic spikes 15-fold. Which traffic characteristic strongly points to legitimate human traffic rather than a botnet flood?',
        options: [
          'All requests originate from a single cloud hosting provider data center with static user-agents',
          'Requests show organic referral paths, diverse browser user-agents, realistic dwell times, and fetch associated CSS/images',
          'Every request arrives at an exact mathematical interval of 500.00 milliseconds with zero timing jitter',
          'All requests target exclusively the administrative login portal page',
        ],
        correct: 1,
        points: 3,
        hint: 'Real human readers browse pages naturally, download images and stylesheets, and arrive via search engines or social media links.',
        explanation: 'Authentic human users exhibit natural browsing variance: they request stylesheets, scripts, and images alongside HTML, spend seconds reading content, display realistic browser headers, and originate from search or social referrers.',
        distractors: [
          'Datacenter IP origin with static user-agents is a classic indicator of automated scraping or botnets.',
          'Sub-millisecond periodic timing with zero jitter is the signature of an automated programmatic script.',
          'Focusing exclusively on administrative login paths indicates credential stuffing or brute force attacks.',
        ],
      },
      {
        id: 8,
        topic: 'Load Balancing and Upstream Filtering',
        question: 'Why is adding more load-balanced backend server instances insufficient by itself against a large volumetric flood attack?',
        options: [
          'Load balancers cannot distribute TCP or UDP packets to multiple servers',
          'If incoming attack volume exceeds the physical upstream bandwidth of the load balancer itself, the entire cluster will still be cut off',
          'Load balancers cause flood packets to duplicate exponentially in memory',
          'Load balancing is only compatible with database software, not web servers',
        ],
        correct: 1,
        points: 3,
        hint: 'Even if you have 100 backend servers, they all sit behind the same internet connection pipe that is clogged upstream.',
        explanation: 'Horizontal scaling and load balancing distribute computational load, but if an attack saturates the physical internet connection or the load balancer\'s ingress capacity, no traffic can reach the cluster regardless of how many instances exist.',
        distractors: [
          'Load balancers routinely distribute Layer 4 TCP/UDP and Layer 7 HTTP traffic across server pools.',
          'Load balancers forward traffic; they do not duplicate packets exponentially.',
          'Load balancing is universally used across web servers, microservices, and databases.',
        ],
      },
      {
        id: 9,
        topic: 'Incident Response & Recovery Plan',
        question: 'What is the industry-standard sequence of phases for responding to a critical denial-of-service security incident?',
        options: [
          'Preparation -> Detection & Analysis -> Containment & Mitigation -> Eradication & Recovery -> Post-Incident Review',
          'Immediately format all server drives -> Pay attacker ransom -> Reinstall operating system',
          'Ignore monitoring alerts -> Wait 48 hours -> Power off entire office building -> Post on social media',
          'File an insurance claim -> Delete system audit logs -> Restart computer -> Resume work',
        ],
        correct: 0,
        points: 3,
        hint: 'Follow the standard NIST SP 800-61 / SANS incident response lifecycle.',
        explanation: 'Structured incident response follows: Preparation (playbooks, tools), Detection & Analysis (identifying attack type/telemetry), Containment & Mitigation (filtering, scrubbing), Eradication & Recovery (restoring normal traffic), and Post-Incident Review (lessons learned).',
        distractors: [
          'Formatting drives destroys forensic evidence and does not stop incoming network flood traffic.',
          'Ignoring alerts and cutting power causes extended downtime without diagnosing the vulnerability.',
          'Deleting logs violates compliance regulations and destroys incident attribution evidence.',
        ],
      },
      {
        id: 10,
        topic: 'Why Encryption Does Not Solve DoS',
        question: 'Why does enabling modern encryption (such as TLS 1.3 / HTTPS) completely fail to protect a web service from denial-of-service flood attacks?',
        options: [
          'Encryption guarantees Confidentiality and Integrity, but decrypting flood handshakes actually consumes heavy CPU, worsening resource exhaustion',
          'Attackers automatically acquire server private keys whenever they send an ICMP ping',
          'TLS 1.3 automatically uninstalls local firewall software on host machines',
          'Encrypted packets travel through physical cables at double the speed of light',
        ],
        correct: 0,
        points: 3,
        hint: 'Remember: encryption protects secrecy, not bandwidth! Doing complex cryptographic math on junk requests strains the CPU even more.',
        explanation: 'Encryption ensures confidentiality and tamper-resistance, not availability. Performing asymmetric cryptographic handshakes on thousands of bogus TLS connection requests expends significant CPU processing, actually making the server MORE vulnerable to CPU exhaustion.',
        distractors: [
          'ICMP pings operate at Layer 3 and have no capability to extract private TLS keys.',
          'TLS 1.3 is a transport security protocol that operates smoothly alongside host firewalls.',
          'All electromagnetic signals travel at the speed of light in the physical medium.',
        ],
      },
    ],
  },

  // =========================================================================
  // 5. 8 DOMAIN INTERACTIVE SCENARIOS & MINI-GAMES
  // =========================================================================
  scenarios: {
    healthcare: {
      id: 'healthcare',
      title: 'Hospital Portal Under Pressure',
      domain: 'Healthcare',
      icon: '🏥',
      hook: 'What if the hospital appointment portal stops responding?',
      situation: 'A regional hospital\'s patient booking portal is suddenly hit by a wave of incoming traffic. Emergency appointment pages fail to load and patients are left staring at spinning wheels.',
      theory: 'Excessive requests consume web worker threads and memory buffers, locking out legitimate medical patients. (Fictional educational simulation).',
      normal: {
        rps: '45 req/sec',
        latency: '110 ms',
        queue: '3 waiting',
        healthPct: 98,
        healthLabel: 'HEALTHY',
        statusText: 'All appointment bookings clearing promptly.',
        log: 'Normal user registrations and doctor schedule requests flowing smoothly.'
      },
      spike: {
        rps: '18,500 req/sec',
        latency: '4,200 ms',
        queue: '1,420 queued',
        healthPct: 15,
        healthLabel: 'CRITICAL (PARALYZED)',
        statusText: 'Severe backlog! Legitimate appointment requests timing out.',
        log: 'WARNING: Connection pool exhausted. 92% packet drop rate detected on booking endpoint.'
      },
      diagnose: {
        question: 'What metric clearly indicates the hospital portal is failing?',
        options: [
          { text: 'Latency surged to 4,200ms and the request queue skyrocketed to 1,420 waiting.', correct: true },
          { text: 'Doctors\' private medical credentials were decrypted and leaked.', correct: false, reason: 'Floods attack system availability, not confidentiality.' },
          { text: 'The hospital building experienced a physical power outage.', correct: false, reason: 'This is a software application flood attack.' }
        ]
      },
      defenses: [
        {
          id: 'rate-limit',
          name: 'IP Rate Limiting & Waiting Room Queue',
          description: 'Restricts appointment requests to 5 per client per minute; sheds repetitive automated bot traffic.',
          effect: '98% of bot spam dropped; real patient bookings resume in 120ms.',
          success: true,
          recovered: {
            rps: '52 req/sec',
            latency: '135 ms',
            queue: '4 waiting',
            healthPct: 95,
            healthLabel: 'PROTECTED (HEALTHY)'
          },
          explanation: 'Rate limiting drops automated bots at the front door so legitimate patients get through smoothly.'
        },
        {
          id: 'encryption',
          name: 'Switch to Stronger 4096-bit TLS Encryption',
          description: 'Enforces heavyweight cryptographic handshakes on all incoming requests.',
          effect: 'CPU usage surges to 100% due to math overhead; portal crashes completely!',
          success: false,
          recovered: {
            rps: '18,500 req/sec',
            latency: '8,500 ms',
            queue: '3,100 queued',
            healthPct: 2,
            healthLabel: 'TOTAL CRASH (0%)'
          },
          explanation: 'Encryption protects secrecy, not bandwidth! Decrypting flood requests multiplies server CPU load.'
        },
        {
          id: 'shutdown',
          name: 'Shut Down the Entire Web Server',
          description: 'Unplugs the appointment server to stop incoming traffic.',
          effect: 'Traffic drops to zero, but genuine patients are completely locked out!',
          success: false,
          recovered: {
            rps: '0 req/sec',
            latency: 'OFFLINE',
            queue: '0',
            healthPct: 0,
            healthLabel: 'OFFLINE (SHUTDOWN)'
          },
          explanation: 'Shutting down services gives the attacker their exact goal: 100% denial of service.'
        }
      ],
      takeaway: 'Healthcare portals must protect availability with rate limiting and queueing so life-saving appointments stay open.'
    },
    banking: {
      id: 'banking',
      title: 'Banking Portal Overload',
      domain: 'Banking & Finance',
      icon: '🏦',
      hook: 'Can attackers steal money just by flooding a banking app?',
      situation: 'Customers nationwide cannot log into their mobile banking dashboard. The transfer gateway hangs while balances fail to update.',
      theory: 'A flood attack can paralyze service availability without breaking encryption or stealing user account funds.',
      normal: {
        rps: '120 req/sec',
        latency: '85 ms',
        queue: '8 waiting',
        healthPct: 99,
        healthLabel: 'HEALTHY',
        statusText: 'Core banking transaction API operating at optimal latency.',
        log: 'Normal wire checks and ATM balance inquiries processed.'
      },
      spike: {
        rps: '29,000 req/sec',
        latency: '6,100 ms',
        queue: '2,900 queued',
        healthPct: 12,
        healthLabel: 'CRITICAL (TIMEOUT)',
        statusText: 'Customers locked out! Mobile banking API timing out.',
        log: 'ALERT: 504 Gateway Timeouts across authentication microservices.'
      },
      diagnose: {
        question: 'Does this traffic flood mean attackers have stolen user account passwords?',
        options: [
          { text: 'No: Flood attacks exhaust server processing and availability, but do not crack passwords.', correct: true },
          { text: 'Yes: A slow banking app proves all bank accounts have been emptied.', correct: false, reason: 'Slowness indicates resource starvation, not fund theft.' },
          { text: 'Yes: Attackers replace user balances with random numbers.', correct: false, reason: 'Integrity remains intact; only access is choked.' }
        ]
      },
      defenses: [
        {
          id: 'scrubbing',
          name: 'Upstream BGP Cloud Scrubbing (Anycast)',
          description: 'Reroutes incoming public traffic through global cleaning centers before it reaches the core banking data center.',
          effect: '28,800 fake req/sec scrubbed at edge; banking logins normalize in 95ms.',
          success: true,
          recovered: {
            rps: '125 req/sec',
            latency: '95 ms',
            queue: '10 waiting',
            healthPct: 96,
            healthLabel: 'PROTECTED (ONLINE)'
          },
          explanation: 'Upstream scrubbing absorbs massive floods at the internet edge before they choke the bank\'s private link.'
        },
        {
          id: 'restart',
          name: 'Continuously Reboot the Database',
          description: 'Restarts the database server every 60 seconds.',
          effect: 'Corrupts ongoing bank transfers and makes downtime even worse!',
          success: false,
          recovered: {
            rps: '0 req/sec',
            latency: 'ERROR',
            queue: 'DATABASE LOCKED',
            healthPct: 5,
            healthLabel: 'CORRUPTED (REBOOT)'
          },
          explanation: 'Rebooting servers under heavy load causes data corruption and does not fix the root incoming flood.'
        }
      ],
      takeaway: 'Availability is vital for financial trust. Use upstream cloud scrubbing so customers never lose access to their funds.'
    },
    ecommerce: {
      id: 'ecommerce',
      title: 'Flash Sale Chaos',
      domain: 'E-commerce',
      icon: '🛒',
      hook: 'Is it a Black Friday stampede or a malicious flood attack?',
      situation: 'A shopping site launches a 50% discount sale. Checkout pages grind to a halt and customers complain of dropped shopping carts.',
      theory: 'Flash crowds and flood attacks cause similar slowness; intelligent rate limiting must separate bots from eager human shoppers.',
      normal: {
        rps: '80 req/sec',
        latency: '150 ms',
        queue: '12 carts',
        healthPct: 97,
        healthLabel: 'HEALTHY',
        statusText: 'Checkout gateway processing transactions normally.',
        log: 'Cart checkouts clearing smoothly.'
      },
      spike: {
        rps: '35,000 req/sec',
        latency: '5,400 ms',
        queue: '4,100 carts',
        healthPct: 18,
        healthLabel: 'CRITICAL (CART LOSS)',
        statusText: 'Severe checkout lag! Cart abandonment rate hits 88%.',
        log: 'WARN: Database connection pool maxed out at 500/500 threads.'
      },
      diagnose: {
        question: 'Why is blocking every high-traffic IP address risky during a flash sale?',
        options: [
          { text: 'It might accidentally block hundreds of real paying human customers sharing network proxies.', correct: true },
          { text: 'Because IP addresses are illegal to block on the internet.', correct: false, reason: 'Blocking malicious IPs is standard, but false positives hurt sales.' },
          { text: 'Because servers automatically break when you add firewall rules.', correct: false, reason: 'Firewalls are designed to filter traffic, but blunt rules cause false positives.' }
        ]
      },
      defenses: [
        {
          id: 'waiting-room',
          name: 'Virtual Waiting Room Queue & Edge Caching',
          description: 'Serves product images from edge CDN and queues buyers fairly into a virtual checkout line.',
          effect: 'Database queries reduced by 90%; checkouts clear smoothly without dropping shoppers.',
          success: true,
          recovered: {
            rps: '110 req/sec',
            latency: '180 ms',
            queue: 'Fair Queue Active',
            healthPct: 94,
            healthLabel: 'PROTECTED (OPTIMIZED)'
          },
          explanation: 'Virtual queues meter traffic smoothly into checkout, preventing database connection crashes.'
        },
        {
          id: 'drop-all-mobile',
          name: 'Block All Mobile Devices',
          description: 'Drops all traffic from iOS and Android users to reduce volume.',
          effect: 'Reduces traffic, but destroys 70% of the retailer\'s actual sales revenue!',
          success: false,
          recovered: {
            rps: '25 req/sec',
            latency: '200 ms',
            queue: 'Low Traffic',
            healthPct: 50,
            healthLabel: 'REVENUE LOSS (50%)'
          },
          explanation: 'Arbitrarily cutting off device categories alienates legitimate customers and loses sales.'
        }
      ],
      takeaway: 'Combine edge CDN caching with virtual waiting rooms to absorb surges without alienating real shoppers.'
    },
    gaming: {
      id: 'gaming',
      title: 'Lagged Out',
      domain: 'Online Gaming',
      icon: '🎮',
      hook: 'Why is your in-game ping suddenly jumping to 999ms?',
      situation: 'In the finals of a competitive tournament, players suddenly experience rubber-banding, delayed hits, and "Connection Lost" kicks.',
      theory: 'Attackers flood game server UDP ports to induce packet loss and lag, ruining real-time synchronization.',
      normal: {
        rps: '64 tick/sec',
        latency: '24 ms',
        queue: '0 buffer',
        healthPct: 99,
        healthLabel: 'OPTIMAL (LOW PING)',
        statusText: 'Flawless 128-tick match sync across all 10 players.',
        log: 'Real-time UDP client positions acknowledged.'
      },
      spike: {
        rps: '45,000 UDP PPS',
        latency: '999 ms',
        queue: '98% Loss',
        healthPct: 10,
        healthLabel: 'CRITICAL (DESYNC)',
        statusText: 'Severe lag! Players desynchronized; ping hits 999ms.',
        log: 'CRITICAL: UDP buffer overflow. Unregistered spoofed datagram flood.'
      },
      diagnose: {
        question: 'Why are UDP flood attacks so popular against online gaming servers?',
        options: [
          { text: 'UDP has no handshake, making it easy for attackers to blast fire-and-forget junk packets at wire speed.', correct: true },
          { text: 'Because UDP packets automatically steal player skins.', correct: false, reason: 'UDP does not inspect inventory data; it just overwhelms the port.' },
          { text: 'Because games cannot use firewalls.', correct: false, reason: 'Game servers use firewalls, but UDP traffic is connectionless.' }
        ]
      },
      defenses: [
        {
          id: 'sdr-proxy',
          name: 'UDP Game Relay Shielding (Edge Routing)',
          description: 'Hides origin server IP behind distributed edge relay proxies that filter spoofed UDP datagrams.',
          effect: 'Junk UDP dropped at edge; tournament players re-sync at crisp 28ms ping.',
          success: true,
          recovered: {
            rps: '64 tick/sec',
            latency: '28 ms',
            queue: '0% Loss',
            healthPct: 98,
            healthLabel: 'PROTECTED (28MS)'
          },
          explanation: 'Edge game proxies hide the real server IP and validate player authentication tickets.'
        },
        {
          id: 'ban-players',
          name: 'Ban Players Reporting High Ping',
          description: 'Kicks anyone whose ping exceeds 100ms.',
          effect: 'Kicks the innocent victim players who were being targeted!',
          success: false,
          recovered: {
            rps: '0 tick/sec',
            latency: 'NO PLAYERS',
            queue: 'Empty Lobby',
            healthPct: 0,
            healthLabel: 'MATCH CANCELLED'
          },
          explanation: 'Punishing victims of lag attacks ruins competitive integrity and plays into the attacker\'s hands.'
        }
      ],
      takeaway: 'Real-time UDP applications require edge proxy relays to mask the server IP and absorb raw packet floods.'
    },
    cloud: {
      id: 'cloud',
      title: 'API Meltdown',
      domain: 'Cloud Services',
      icon: '☁️',
      hook: 'How does one flooded API endpoint crash an entire cloud cluster?',
      situation: 'A public REST API microservice gets flooded with requests. Downstream databases exhaust connection pools and trigger cascading failures.',
      theory: 'Without rate limits and circuit breakers, one flooded microservice can cascade and bring down the entire cloud cluster.',
      normal: {
        rps: '250 req/sec',
        latency: '65 ms',
        queue: '15 active',
        healthPct: 98,
        healthLabel: 'HEALTHY',
        statusText: 'All microservices operating within allocated CPU quotas.',
        log: 'JSON payloads validated and dispatched to worker nodes.'
      },
      spike: {
        rps: '52,000 req/sec',
        latency: '7,800 ms',
        queue: '5,000 queued',
        healthPct: 8,
        healthLabel: 'CRITICAL (CASCADING)',
        statusText: 'API Gateway choked! 503 Service Unavailable errors across all apps.',
        log: 'ERROR: Database worker thread starvation. Cloud billing skyrocketing!'
      },
      diagnose: {
        question: 'What is "Denial of Wallet" in cloud auto-scaling during a flood attack?',
        options: [
          { text: 'Auto-scaling spawns thousands of expensive cloud instances trying to fight the flood, racking up massive bills.', correct: true },
          { text: 'Hackers stealing the developer\'s physical leather wallet.', correct: false, reason: 'It refers to runaway cloud computing bills.' },
          { text: 'Cloud providers charging a fine for bad coding.', correct: false, reason: 'It is a cost exhaustion attack on auto-scaling infrastructure.' }
        ]
      },
      defenses: [
        {
          id: 'circuit-breaker',
          name: 'Token-Bucket Rate Limiter & Circuit Breaker',
          description: 'Enforces strict per-API-key token rate limits and trips circuit breakers to insulate core databases.',
          effect: 'Excess requests rejected with 429 status; backend databases stabilize at 70ms.',
          success: true,
          recovered: {
            rps: '280 req/sec',
            latency: '72 ms',
            queue: '18 active',
            healthPct: 96,
            healthLabel: 'PROTECTED (ISOLATED)'
          },
          explanation: 'Token bucket rate limiters reject abusive traffic at the API gateway before it reaches core databases.'
        },
        {
          id: 'infinite-scale',
          name: 'Turn Off Auto-Scaling Limits Completely',
          description: 'Allows the cloud to spawn unlimited server instances.',
          effect: 'Costs $15,000 in 3 hours while database still chokes on connection limits!',
          success: false,
          recovered: {
            rps: '52,000 req/sec',
            latency: '5,000 ms',
            queue: 'BILLING OVERRUN',
            healthPct: 20,
            healthLabel: 'DENIAL OF WALLET'
          },
          explanation: 'Infinite auto-scaling exhausts financial budgets without solving backend architectural bottlenecks.'
        }
      ],
      takeaway: 'Implement strict rate limits and circuit breaker patterns to prevent single flooded endpoints from breaking your cloud.'
    },
    education: {
      id: 'education',
      title: 'Exam Portal Panic',
      domain: 'Education',
      icon: '🎓',
      hook: 'Exam submission deadline in 5 minutes... and the portal won\'t load!',
      situation: 'Minutes before a midnight assignment deadline, a university portal is overwhelmed with traffic. Submissions fail and students panic.',
      theory: 'Attackers or flash crowds target high-stakes deadline windows when availability is critical to student success.',
      normal: {
        rps: '35 req/sec',
        latency: '90 ms',
        queue: '2 files',
        healthPct: 98,
        healthLabel: 'HEALTHY',
        statusText: 'Assignment uploads storing to storage bucket cleanly.',
        log: 'Student sessions authenticated via single-sign-on.'
      },
      spike: {
        rps: '12,000 req/sec',
        latency: '4,900 ms',
        queue: '950 submissions',
        healthPct: 14,
        healthLabel: 'CRITICAL (504 TIMEOUT)',
        statusText: 'Portal frozen! Students receiving 504 Gateway Timeout on upload.',
        log: 'WARN: File upload buffers full. PHP worker pool exhausted.'
      },
      diagnose: {
        question: 'Why do educational institutions frequently experience availability crises?',
        options: [
          { text: 'Deadlines create sudden surges of thousands of students trying to upload large files simultaneously.', correct: true },
          { text: 'Because college students do not know how to type on keyboards.', correct: false, reason: 'Typing speed is not related to server bandwidth capacity.' },
          { text: 'Because educational software is legally forbidden from using servers.', correct: false, reason: 'Educational portals run on standard web infrastructure.' }
        ]
      },
      defenses: [
        {
          id: 'async-queue',
          name: 'Asynchronous S3 Direct Upload & Queueing',
          description: 'Uploads files directly to cloud storage, bypassing the application server CPU entirely.',
          effect: 'Submissions succeed immediately with guaranteed timestamp receipts; portal stays at 100ms.',
          success: true,
          recovered: {
            rps: '42 req/sec',
            latency: '105 ms',
            queue: 'Async Processed',
            healthPct: 97,
            healthLabel: 'PROTECTED (CONFIRMED)'
          },
          explanation: 'Offloading large file uploads directly to object storage frees the web server to handle logins easily.'
        },
        {
          id: 'cancel-deadline',
          name: 'Cancel the Exam for Everyone',
          description: 'Gives up and reschedules the exam for next month.',
          effect: 'Causes administrative nightmare, student distress, and doesn\'t fix the underlying portal!',
          success: false,
          recovered: {
            rps: '0 req/sec',
            latency: 'N/A',
            queue: 'Cancelled',
            healthPct: 30,
            healthLabel: 'ADMIN CHAOS'
          },
          explanation: 'Cancelling events avoids the technical challenge without building resilient infrastructure.'
        }
      ],
      takeaway: 'Decouple file uploads from core web servers so deadline surges cannot paralyze student submissions.'
    },
    transport: {
      id: 'transport',
      title: 'The Double-Booked Bus Seat',
      domain: 'Transport & Ticketing',
      icon: '🚌',
      hook: 'Can a packet surge cause two passengers to book the exact same seat?',
      situation: 'A popular bus route has only 1 remaining seat (Seat 12B). Multiple passengers rush to book it at the exact same millisecond while an overwhelming packet flood strikes the booking API.',
      theory: 'Flood traffic causes severe service latency, but duplicate bookings are a distinct application concurrency flaw (race condition). Rate limiting controls traffic volume, while atomic transactions prevent conflicting bookings.',
      normal: {
        rps: '24 req/sec',
        latency: '75 ms',
        queue: '1 waiting',
        healthPct: 99,
        healthLabel: 'HEALTHY',
        statusText: 'Bus seat map responsive; Seat 12B available for reservation.',
        log: 'Seat selection API responding with valid lock tokens.'
      },
      spike: {
        rps: '32,000 req/sec',
        latency: '5,200 ms',
        queue: '3,200 queued',
        healthPct: 10,
        healthLabel: 'CRITICAL (RACE CONDITION)',
        statusText: 'Severe lag! Conflicting requests processed without atomic locks. DOUBLE BOOKING OCCURRED!',
        log: 'RACE CONDITION DETECTED: Seat 12B assigned simultaneously to Passenger #1 and Passenger #2!'
      },
      diagnose: {
        question: 'Why did the bus booking service experience both slowdown and duplicate bookings?',
        options: [
          { text: 'Excessive requests exhausted server capacity (causing slowness), while poor concurrency control (lack of atomic locking) allowed conflicting bookings to slip through simultaneously.', correct: true },
          { text: 'Flood packets physically cut the bus tires on the highway.', correct: false, reason: 'This is a digital booking software simulation, not a vehicle mechanical fault.' },
          { text: 'A flood attack automatically duplicates all database records by definition.', correct: false, reason: 'Floods exhaust availability; duplicate booking is a separate application logic concurrency bug.' }
        ]
      },
      defenses: [
        {
          id: 'both',
          name: 'Apply Both Defenses: Rate Limiting + Atomic Seat Reservation',
          description: 'Engages token-bucket rate limiting to shed the flood, while enforcing atomic database transactions (mutex locks) so only 1 passenger gets the seat.',
          effect: 'Flood discarded at edge; Seat 12B locked atomically to first verified passenger; second passenger receives "Seat Unavailable". 100% resolved!',
          success: true,
          recovered: {
            rps: '28 req/sec',
            latency: '82 ms',
            queue: 'Fair Queue Active',
            healthPct: 98,
            healthLabel: 'PROTECTED (ATOMIC LOCK)'
          },
          explanation: 'Rate limiting controls excessive request volume, while atomic reservation prevents conflicting bookings. Working together, the system remains fast and logically correct.'
        },
        {
          id: 'rate-only',
          name: 'Apply Request Rate Limiting Only',
          description: 'Restricts incoming requests to 10/sec, dropping the flood traffic.',
          effect: 'Latency improves to 85ms, BUT without atomic database locking, competing passengers still trigger race conditions and double-book!',
          success: false,
          recovered: {
            rps: '28 req/sec',
            latency: '85 ms',
            queue: 'Throttled',
            healthPct: 60,
            healthLabel: 'SUBOPTIMAL (DOUBLE BOOKED)'
          },
          explanation: 'Rate limiting solves traffic volume, but cannot solve application concurrency bugs. You still need atomic database transactions!'
        },
        {
          id: 'atomic-only',
          name: 'Apply Atomic Seat Reservation Only',
          description: 'Adds database mutex locking to prevent duplicate seat assignments, without adding any rate limiting.',
          effect: 'Prevents double-booking, BUT the booking server is still overwhelmed by 32,000 req/sec flood, causing 5-second loading spinners!',
          success: false,
          recovered: {
            rps: '32,000 req/sec',
            latency: '4,900 ms',
            queue: '2,900 queued',
            healthPct: 25,
            healthLabel: 'SUBOPTIMAL (HIGH LATENCY)'
          },
          explanation: 'Atomic locking guarantees data consistency, but does not stop network flood volume. Both defenses are necessary.'
        }
      ],
      takeaway: 'A flood attack causes availability slowdowns, but duplicate booking is a concurrency flaw. Always pair network rate limiting with atomic database transactions.'
    },
    communication: {
      id: 'communication',
      title: 'Message Queue Chaos',
      domain: 'Communication Platforms',
      icon: '💬',
      hook: 'Why are urgent team messages taking 20 minutes to deliver?',
      situation: 'A team chat and voice collaboration tool experiences message delivery delays during a sudden traffic spike. Chats are stuck on pending.',
      theory: 'Excessive messaging requests flood memory message brokers (e.g. RabbitMQ/Kafka), causing queue delays and voice call packet drops.',
      normal: {
        rps: '500 msg/sec',
        latency: '18 ms',
        queue: '5 in flight',
        healthPct: 99,
        healthLabel: 'HEALTHY (REAL-TIME)',
        statusText: 'Instant message delivery operating at sub-20ms latency.',
        log: 'WebSocket persistent connections healthy.'
      },
      spike: {
        rps: '68,000 msg/sec',
        latency: '8,200 ms',
        queue: '120,000 backlogged',
        healthPct: 9,
        healthLabel: 'CRITICAL (DESYNC)',
        statusText: 'Queue backlogged! Messages taking minutes to deliver.',
        log: 'CRITICAL: Redis / Kafka message broker memory limit reached (98%).'
      },
      diagnose: {
        question: 'What happens to voice calls when packet delays (latency) exceed 500ms?',
        options: [
          { text: 'Voice becomes unintelligible, choppy, or disconnects entirely because audio cannot tolerate high latency.', correct: true },
          { text: 'The voice volume becomes 10 times louder.', correct: false, reason: 'Latency causes delay and packet drops, not volume changes.' },
          { text: 'The computer microphone converts into a camera.', correct: false, reason: 'Network lag does not alter hardware capabilities.' }
        ]
      },
      defenses: [
        {
          id: 'backpressure',
          name: 'Rate Throttling & Backpressure Shedding',
          description: 'Enforces rate limits on automated channel bots and sheds non-essential typing indicators.',
          effect: 'Queue drains rapidly; real human chat messages arrive in 22ms.',
          success: true,
          recovered: {
            rps: '520 msg/sec',
            latency: '22 ms',
            queue: '8 in flight',
            healthPct: 97,
            healthLabel: 'PROTECTED (DRAINED)'
          },
          explanation: 'Dropping non-critical metadata (like typing indicators) protects core chat delivery during surges.'
        },
        {
          id: 'delete-all',
          name: 'Wipe the Entire Message Database',
          description: 'Deletes all channels and conversation history.',
          effect: 'Destroys all corporate records and communications permanently!',
          success: false,
          recovered: {
            rps: '0 msg/sec',
            latency: 'NO DATA',
            queue: 'DATA WIPED',
            healthPct: 0,
            healthLabel: 'DATA LOSS DISASTER'
          },
          explanation: 'Destructive shortcuts violate data integrity and permanently damage user trust.'
        }
      ],
      takeaway: 'Implement backpressure and drop non-essential metadata during surges to keep critical communications flowing.'
    }
  }
};

// Export for Node or browser
if (typeof window !== 'undefined') {
  window.EducationalData = EducationalData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EducationalData };
}
