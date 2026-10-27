import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TechFest Hub database...');

  // Clean existing data
  await prisma.attendance.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.team.deleteMany();
  await prisma.event.deleteMany();
  await prisma.eventCategory.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      name: 'Dr. Eleanor Vance',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          college: 'Imperial College of Engineering',
          department: 'Dean of Student Affairs & Technology',
          graduationYear: 2005,
          phoneNumber: '+1 (555) 019-2831',
          bio: 'Platform Administrator overseeing collegiate technical symposiums, research symposiums, and national hackathons.',
        },
      },
    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      email: 'sarah.organizer@college.edu',
      name: 'Sarah Chen',
      passwordHash,
      role: 'ORGANIZER',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          college: 'Imperial College of Engineering',
          department: 'Computer Science & Engineering',
          graduationYear: 2024,
          studentIdNumber: 'ICE-CS-2024-042',
          phoneNumber: '+1 (555) 014-9921',
          githubUrl: 'https://github.com/sarah-chen',
          linkedinUrl: 'https://linkedin.com/in/sarahchen-tech',
          bio: 'Lead Coordinator for ACM & IEEE Student Chapter. Passionate about hackathons, machine learning, and student mentorship.',
        },
      },
    },
  });

  const organizerUser2 = await prisma.user.create({
    data: {
      email: 'marcus.organizer@college.edu',
      name: 'Prof. Marcus Brody',
      passwordHash,
      role: 'ORGANIZER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          college: 'Imperial College of Engineering',
          department: 'Robotics & Mechatronics Lab',
          graduationYear: 2012,
          phoneNumber: '+1 (555) 018-7734',
          bio: 'Faculty lead for Autonomous Systems and Competitive Robotics arenas.',
        },
      },
    },
  });

  const studentAlex = await prisma.user.create({
    data: {
      email: 'alex.student@college.edu',
      name: 'Alex Rivera',
      passwordHash,
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          college: 'Imperial College of Engineering',
          department: 'Computer Science (AI Specialization)',
          graduationYear: 2027,
          studentIdNumber: 'ICE-CS-2027-108',
          phoneNumber: '+1 (555) 012-3456',
          githubUrl: 'https://github.com/alexrivera-dev',
          linkedinUrl: 'https://linkedin.com/in/alexrivera-tech',
          bio: '3rd year undergrad enthusiastic about full-stack systems, competitive coding, and distributed computing.',
          skills: 'TypeScript, React, Python, PyTorch, Docker, PostgreSQL',
        },
      },
    },
  });

  const studentJordan = await prisma.user.create({
    data: {
      email: 'jordan.student@college.edu',
      name: 'Jordan Lee',
      passwordHash,
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          college: 'Imperial College of Engineering',
          department: 'Electrical & Computer Engineering',
          graduationYear: 2026,
          studentIdNumber: 'ICE-ECE-2026-088',
          phoneNumber: '+1 (555) 017-8899',
          githubUrl: 'https://github.com/jordan-lee',
          bio: 'Hardware hacker and systems engineer. Loves microcontrollers, embedded C, and ROS 2.',
        },
      },
    },
  });

  const studentMaya = await prisma.user.create({
    data: {
      email: 'maya.student@college.edu',
      name: 'Maya Patel',
      passwordHash,
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          college: 'Metro Tech University',
          department: 'Data Science & Analytics',
          graduationYear: 2027,
          studentIdNumber: 'MTU-DS-2027-015',
          phoneNumber: '+1 (555) 013-4412',
          bio: 'Competitive coder and ML researcher. 5-star HackerRank problem solver.',
        },
      },
    },
  });

  const studentLiam = await prisma.user.create({
    data: {
      email: 'liam.student@college.edu',
      name: 'Liam Davis',
      passwordHash,
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      profile: {
        create: {
          college: 'Imperial College of Engineering',
          department: 'Information Security & Cloud',
          graduationYear: 2026,
          studentIdNumber: 'ICE-SEC-2026-034',
          phoneNumber: '+1 (555) 016-5578',
          bio: 'CTF player, ethical hacker, and Linux enthusiast.',
        },
      },
    },
  });

  // 2. Categories
  const categoriesData = [
    {
      name: 'Hackathons',
      slug: 'hackathons',
      description: '36-48 hour intensive product building competitions and overnight sprints.',
      icon: 'Code2',
      color: 'indigo',
    },
    {
      name: 'Coding Contests',
      slug: 'coding-contests',
      description: 'Algorithmic speed challenges, data structures, and competitive problem solving.',
      icon: 'Terminal',
      color: 'violet',
    },
    {
      name: 'Workshops',
      slug: 'workshops',
      description: 'Hands-on technical masterclasses led by industry engineers and faculty experts.',
      icon: 'Laptop',
      color: 'sky',
    },
    {
      name: 'Seminars',
      slug: 'seminars',
      description: 'Keynotes, fireside chats, research presentations, and tech career panels.',
      icon: 'Presentation',
      color: 'amber',
    },
    {
      name: 'Robotics',
      slug: 'robotics',
      description: 'Autonomous rovers, drone navigation, line followers, and combat mechatronics.',
      icon: 'Cpu',
      color: 'emerald',
    },
    {
      name: 'AI & Machine Learning',
      slug: 'ai-ml',
      description: 'Generative AI, Large Language Models, deep learning sprints, and computer vision.',
      icon: 'BrainCircuit',
      color: 'purple',
    },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.eventCategory.create({ data: cat });
  }

  // 3. Events
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Event 1: HackSphere 2026
  const hackathon = await prisma.event.create({
    data: {
      title: 'HackSphere 2026: 36-Hour National AI Hackathon',
      slug: 'hacksphere-2026-ai-hackathon',
      description: `Welcome to HackSphere 2026, the premier inter-collegiate hackathon uniting over 400 passionate engineers, designers, and innovators.

## Challenge Tracks
1. **Generative Intelligence & Autonomous Agents**: Build multi-modal agents that solve high-friction real-world workflows.
2. **HealthTech & Accessibility**: Engineer software or hardware tools that expand medical triage or assist disabled individuals.
3. **FinTech & Decentralized Infrastructure**: Zero-knowledge verification, algorithmic risk analysis, and fraud prevention.
4. **Smart Campus & Green Energy**: IoT sensors and ML optimization for urban microgrids.

## What's Provided
- High-speed 10Gbps dedicated mesh network.
- 24/7 food, midnight pizza, energy drinks, and rest lounges.
- Cloud credits ($200 per finalist team).
- Direct interviews with sponsoring tech unicorns.

## Schedule Highlights
- Friday 6:00 PM: Opening Ceremony & Problem Statement Release
- Friday 9:00 PM: Hacking Begins & Mentor Matching
- Saturday 2:00 PM: Midway Progress Checkpoint
- Sunday 8:00 AM: Code Freeze & Submission on TechFest Hub
- Sunday 11:00 AM: Top 10 Stage Demos & Prize Distribution`,
      shortDescription: '36-hour flagship hackathon with $8,000 in prizes, cloud compute credits, and sponsor challenges.',
      categoryId: categories['hackathons'].id,
      organizerId: organizerUser.id,
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
      format: 'OFFLINE',
      venue: 'Grand Innovation Complex, Hall 4 & 5, Imperial College Campus',
      startDate: new Date(now.getTime() + 14 * dayMs),
      endDate: new Date(now.getTime() + 16 * dayMs),
      registrationDeadline: new Date(now.getTime() + 10 * dayMs),
      capacity: 120,
      registrationType: 'TEAM',
      minTeamSize: 2,
      maxTeamSize: 4,
      eligibility: 'Open to all currently enrolled undergraduate and postgraduate university students. Valid student ID required.',
      rules: 'All code must be written during the event duration. Open-source libraries are permitted; pre-built proprietary software is strictly prohibited.',
      prizes: '1st Place: $4,000 + Golden Trophy | 2nd Place: $2,500 | 3rd Place: $1,500 | Best AI Agent: $500',
      status: 'PUBLISHED',
    },
  });

  // Event 2: CodeRush Blitz
  const codingContest = await prisma.event.create({
    data: {
      title: 'CodeRush Blitz: Algorithmic Showdown 2026',
      slug: 'coderush-blitz-2026',
      description: `Test your speed, precision, and mastery over data structures in this intense 4-hour competitive coding blitz.

### Contest Format
- 6 Algorithmic Problems ranging from Div 2 Medium to Div 1 Hard.
- Supported Languages: C++20, Java 21, Python 3.12, Rust, Go.
- Strict time limits (1.0s to 2.5s) and memory limits (256MB).
- Dynamic ICPC penalty scoring with instant test-case feedback.

Top scorers qualify for the State Championship finals!`,
      shortDescription: '4-hour high-stakes algorithmic showdown covering dynamic programming, graphs, and combinatorics.',
      categoryId: categories['coding-contests'].id,
      organizerId: organizerUser.id,
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      format: 'ONLINE',
      onlineLink: 'https://meet.google.com/ais-coderush-live',
      startDate: new Date(now.getTime() + 5 * dayMs),
      endDate: new Date(now.getTime() + 5 * dayMs + 4 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 4 * dayMs),
      capacity: 80,
      registrationType: 'INDIVIDUAL',
      minTeamSize: 1,
      maxTeamSize: 1,
      eligibility: 'Open to all college students. Pre-registration via TechFest Hub required for competition leaderboard credentials.',
      rules: 'Individual contest. External LLM code assistance, plagiarism, or multi-accounting results in immediate disqualification.',
      prizes: '1st: $1,200 + Mechanical Keyboard | 2nd: $800 | 3rd: $500 | Top 10: CodeRush T-Shirt & Swag Pack',
      status: 'PUBLISHED',
    },
  });

  // Event 3: AI Workshop
  const aiWorkshop = await prisma.event.create({
    data: {
      title: 'Deep Dive: Building Production AI Agents & LLM Pipelines',
      slug: 'building-production-ai-agents',
      description: `Join principal engineers from top AI research labs for a deep dive into building deterministic, resilient multi-agent architectures.

### What You Will Build
- Retrieval Augmented Generation (RAG) with vector embeddings & hybrid reranking.
- Tool-calling agent loops with function execution and structured output schemas.
- Self-correcting code generation workflows.
- Observability and evaluation metrics for hallucination mitigation.

Includes complete starter repository, Jupyter notebooks, and cloud runtime access.`,
      shortDescription: 'Hands-on masterclass on building autonomous LLM agents, vector embeddings, and RAG pipelines.',
      categoryId: categories['ai-ml'].id,
      organizerId: organizerUser.id,
      bannerUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&auto=format&fit=crop&q=80',
      format: 'HYBRID',
      venue: 'Turing Computer Lab & Online Livestream',
      onlineLink: 'https://meet.google.com/ais-deepdive-agent',
      startDate: new Date(now.getTime() + 8 * dayMs),
      endDate: new Date(now.getTime() + 8 * dayMs + 6 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 7 * dayMs),
      capacity: 50,
      registrationType: 'INDIVIDUAL',
      minTeamSize: 1,
      maxTeamSize: 1,
      eligibility: 'Basic proficiency in Python and async programming recommended. Bring your own laptop.',
      rules: 'Participants must complete all 3 coding assignments during the session to receive a verified workshop credential.',
      prizes: 'Certificate of Excellence + 6 months JetBrains All Products Pack for top project submission',
      status: 'PUBLISHED',
    },
  });

  // Event 4: RoboWars
  const roboWars = await prisma.event.create({
    data: {
      title: 'RoboWars: Autonomous Rover Navigation & Arena Challenge',
      slug: 'robowars-autonomous-rover-2026',
      description: `Build, calibrate, and program an autonomous rover to traverse an obstacle-ridden terrain with LiDAR SLAM and camera vision.

### Arena Specs
- 15m x 15m modular dynamic arena with ramps, gravel pit, and tunnel obstacles.
- Dynamic QR markers and AprilTags for localized navigation checkpoints.
- Strict weight restriction: 5.0 kg maximum dry weight.
- Power constraint: 4S LiPo maximum battery voltage.`,
      shortDescription: 'Autonomous rover challenge with obstacle course navigation, computer vision, and dynamic waypoints.',
      categoryId: categories['robotics'].id,
      organizerId: organizerUser2.id,
      bannerUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      format: 'OFFLINE',
      venue: 'Engineering Quadrangle, Arena Beta',
      startDate: new Date(now.getTime() + 18 * dayMs),
      endDate: new Date(now.getTime() + 19 * dayMs),
      registrationDeadline: new Date(now.getTime() + 13 * dayMs),
      capacity: 25,
      registrationType: 'TEAM',
      minTeamSize: 2,
      maxTeamSize: 4,
      eligibility: 'Open to engineering and science undergraduates.',
      rules: 'Robots must be fully autonomous during competition runs. Any manual radio override incurs severe point penalties.',
      prizes: '1st: $2,500 + Industrial Sensor Kits | 2nd: $1,500 | 3rd: $800',
      status: 'PUBLISHED',
    },
  });

  // Event 5: CyberSec CTF
  const cyberSec = await prisma.event.create({
    data: {
      title: 'CyberSec CTF: Collegiate Capture The Flag Invitational',
      slug: 'cybersec-ctf-invitational',
      description: `Test your offensive and defensive security capabilities across Web Security, Binary Exploitation, Cryptography, Reverse Engineering, and Forensics.

### Challenge Categories
- **Web**: JWT forged states, prototype pollution, SSRF to cloud metadata.
- **Pwn**: Stack overflows, ROP gadgets, format string vulnerabilities.
- **Crypto**: Broken RSA implementations, elliptic curve discrete logs.
- **Forensics**: Memory dump analysis, corrupted packet capture PCAPs.`,
      shortDescription: 'Jeopardy-style capture the flag tournament with real-world vulnerability scenarios.',
      categoryId: categories['coding-contests'].id,
      organizerId: organizerUser.id,
      bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
      format: 'ONLINE',
      onlineLink: 'https://ctf.techfesthub.edu',
      startDate: new Date(now.getTime() + 11 * dayMs),
      endDate: new Date(now.getTime() + 12 * dayMs),
      registrationDeadline: new Date(now.getTime() + 9 * dayMs),
      capacity: 60,
      registrationType: 'TEAM',
      minTeamSize: 1,
      maxTeamSize: 3,
      eligibility: 'Open to all university students worldwide.',
      rules: 'Do not attack the infrastructure or scoring servers. Sharing flags between competing teams leads to permanent ban.',
      prizes: '1st: $1,500 + OffSec Exam Vouchers | 2nd: $1,000 | 3rd: $500',
      status: 'PUBLISHED',
    },
  });

  // Event 6: Completed Event (for certificate testing!)
  const completedEvent = await prisma.event.create({
    data: {
      title: 'Cloud Architecture & DevOps Masterclass 2026',
      slug: 'cloud-devops-masterclass-2026',
      description: 'Comprehensive 2-day boot camp on Kubernetes, Terraform, microservices architecture, and CI/CD automation.',
      shortDescription: 'Intensive boot camp on Kubernetes, infrastructure as code, and production reliability.',
      categoryId: categories['workshops'].id,
      organizerId: organizerUser.id,
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      format: 'OFFLINE',
      venue: 'Auditorium C, Tech Building',
      startDate: new Date(now.getTime() - 14 * dayMs),
      endDate: new Date(now.getTime() - 13 * dayMs),
      registrationDeadline: new Date(now.getTime() - 16 * dayMs),
      capacity: 100,
      registrationType: 'INDIVIDUAL',
      minTeamSize: 1,
      maxTeamSize: 1,
      eligibility: 'All students',
      status: 'COMPLETED',
    },
  });

  // Event 7: Pending Approval Event (for Admin workflow demo!)
  await prisma.event.create({
    data: {
      title: 'Quantum Computing & Qiskit Exploratory Seminar',
      slug: 'quantum-computing-qiskit-seminar',
      description: 'Introductory seminar on quantum superposition, quantum gates, entanglement, and executing circuits on IBM Quantum hardware.',
      shortDescription: 'Explore quantum algorithms, qubits, and real hardware execution via Qiskit.',
      categoryId: categories['seminars'].id,
      organizerId: organizerUser.id,
      bannerUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
      format: 'HYBRID',
      venue: 'Physics Lecture Hall 101',
      startDate: new Date(now.getTime() + 25 * dayMs),
      endDate: new Date(now.getTime() + 25 * dayMs + 3 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 22 * dayMs),
      capacity: 150,
      registrationType: 'INDIVIDUAL',
      minTeamSize: 1,
      maxTeamSize: 1,
      eligibility: 'All university students interested in quantum mechanics and physics.',
      status: 'PENDING_APPROVAL',
      approvalNotes: 'Pending syllabus review and speaker confirmation.',
    },
  });

  // 4. Teams
  // Team ByteForce for Alex & Jordan in HackSphere
  const teamByteForce = await prisma.team.create({
    data: {
      name: 'ByteForce AI',
      code: 'TEAM-BYTE-88',
      eventId: hackathon.id,
      leaderId: studentAlex.id,
      members: {
        create: [
          { userId: studentAlex.id, role: 'LEADER' },
          { userId: studentJordan.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 5. Registrations & Tickets
  // Alex registered for CodeRush Blitz (Individual, CONFIRMED)
  const regAlexCodeRush = await prisma.registration.create({
    data: {
      registrationNumber: 'REG-2026-CR-001',
      eventId: codingContest.id,
      userId: studentAlex.id,
      status: 'CONFIRMED',
      ticket: {
        create: {
          ticketToken: 'TKT-CR26-ALEX-9981-SEC',
          qrCodeData: JSON.stringify({
            app: 'TechFestHub',
            regId: 'REG-2026-CR-001',
            eventId: codingContest.id,
            eventName: codingContest.title,
            attendee: studentAlex.name,
            token: 'TKT-CR26-ALEX-9981-SEC',
          }),
        },
      },
    },
  });

  // Alex & Jordan registered for HackSphere as Team ByteForce
  await prisma.registration.create({
    data: {
      registrationNumber: 'REG-2026-HS-TEAM-01',
      eventId: hackathon.id,
      userId: studentAlex.id,
      teamId: teamByteForce.id,
      status: 'CONFIRMED',
      ticket: {
        create: {
          ticketToken: 'TKT-HS26-BYTEFORCE-ALEX',
          qrCodeData: JSON.stringify({
            app: 'TechFestHub',
            regId: 'REG-2026-HS-TEAM-01',
            eventId: hackathon.id,
            eventName: hackathon.title,
            team: teamByteForce.name,
            attendee: studentAlex.name,
            token: 'TKT-HS26-BYTEFORCE-ALEX',
          }),
        },
      },
    },
  });

  await prisma.registration.create({
    data: {
      registrationNumber: 'REG-2026-HS-TEAM-02',
      eventId: hackathon.id,
      userId: studentJordan.id,
      teamId: teamByteForce.id,
      status: 'CONFIRMED',
      ticket: {
        create: {
          ticketToken: 'TKT-HS26-BYTEFORCE-JORDAN',
          qrCodeData: JSON.stringify({
            app: 'TechFestHub',
            regId: 'REG-2026-HS-TEAM-02',
            eventId: hackathon.id,
            eventName: hackathon.title,
            team: teamByteForce.name,
            attendee: studentJordan.name,
            token: 'TKT-HS26-BYTEFORCE-JORDAN',
          }),
        },
      },
    },
  });

  // Maya registered for AI Workshop (CONFIRMED)
  await prisma.registration.create({
    data: {
      registrationNumber: 'REG-2026-AI-014',
      eventId: aiWorkshop.id,
      userId: studentMaya.id,
      status: 'CONFIRMED',
      ticket: {
        create: {
          ticketToken: 'TKT-AI26-MAYA-4412',
          qrCodeData: JSON.stringify({
            app: 'TechFestHub',
            regId: 'REG-2026-AI-014',
            eventId: aiWorkshop.id,
            attendee: studentMaya.name,
            token: 'TKT-AI26-MAYA-4412',
          }),
        },
      },
    },
  });

  // Liam on WAITLIST for AI Workshop (Waitlist testing!)
  await prisma.registration.create({
    data: {
      registrationNumber: 'REG-2026-AI-WL-001',
      eventId: aiWorkshop.id,
      userId: studentLiam.id,
      status: 'WAITLISTED',
      waitlistPosition: 1,
    },
  });

  // Completed Event: Alex attended and received Certificate!
  const regAlexCompleted = await prisma.registration.create({
    data: {
      registrationNumber: 'REG-2026-CD-009',
      eventId: completedEvent.id,
      userId: studentAlex.id,
      status: 'CONFIRMED',
      attendance: {
        create: {
          eventId: completedEvent.id,
          checkedInById: organizerUser.id,
          checkedInAt: new Date(now.getTime() - 14 * dayMs + 2 * 60 * 60 * 1000),
          checkInMethod: 'QR_SCAN',
        },
      },
    },
  });

  // 6. Certificate for Alex
  await prisma.certificate.create({
    data: {
      certificateNumber: 'CERT-TECHFEST-2026-9041',
      eventId: completedEvent.id,
      userId: studentAlex.id,
      title: 'Certificate of Technical Achievement',
      recipientName: studentAlex.name,
      issuedAt: new Date(now.getTime() - 12 * dayMs),
      verificationUrl: '/verify-certificate?id=CERT-TECHFEST-2026-9041',
    },
  });

  // 7. Notifications for Alex
  await prisma.notification.createMany({
    data: [
      {
        userId: studentAlex.id,
        title: 'Registration Confirmed: CodeRush Blitz 2026',
        message: 'Your individual registration for CodeRush Blitz is confirmed. Your digital QR ticket is now active!',
        type: 'REGISTRATION',
        link: '/tickets',
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: studentAlex.id,
        title: 'Team ByteForce AI Ready',
        message: 'Jordan Lee accepted your team invitation. ByteForce AI is confirmed for HackSphere 2026.',
        type: 'TEAM',
        link: '/teams',
        isRead: true,
        createdAt: new Date(now.getTime() - 1 * dayMs),
      },
      {
        userId: studentAlex.id,
        title: 'Verified Certificate Issued',
        message: 'Your Certificate of Technical Achievement for Cloud Architecture Bootcamp 2026 has been issued.',
        type: 'CERTIFICATE',
        link: '/certificates',
        isRead: true,
        createdAt: new Date(now.getTime() - 12 * dayMs),
      },
    ],
  });

  // 8. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: 'EVENT_APPROVED',
        targetType: 'EVENT',
        targetId: hackathon.id,
        details: JSON.stringify({ title: hackathon.title, capacity: 120 }),
        createdAt: new Date(now.getTime() - 2 * dayMs),
      },
      {
        actorId: adminUser.id,
        action: 'ROLE_UPDATED',
        targetType: 'USER',
        targetId: organizerUser.id,
        details: JSON.stringify({ role: 'ORGANIZER', reason: 'Approved student chapter coordinator' }),
        createdAt: new Date(now.getTime() - 15 * dayMs),
      },
      {
        actorId: organizerUser.id,
        action: 'ATTENDANCE_CHECKIN',
        targetType: 'REGISTRATION',
        targetId: regAlexCompleted.id,
        details: JSON.stringify({ method: 'QR_SCAN', event: completedEvent.title }),
        createdAt: new Date(now.getTime() - 14 * dayMs),
      },
    ],
  });

  console.log('Seeding complete! Database populated with events, users, teams, registrations, and certificates.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
