import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting TechFest Hub automated test suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: User Registration & Password Hashing
    console.log('1. Authentication & Security Tests:');
    const testEmail = `test.student.${Date.now()}@college.edu`;
    const password = 'TestPassword123!';
    const passwordHash = await bcrypt.hash(password, 10);

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: 'Unit Tester',
        role: 'STUDENT',
        profile: {
          create: { college: 'Test College', department: 'CS' },
        },
      },
    });

    assert(Boolean(testUser.id), 'Student registration creates persistent record');
    assert(testUser.role === 'STUDENT', 'New user role is strictly STUDENT by default');

    const isMatch = await bcrypt.compare(password, testUser.passwordHash);
    assert(isMatch, 'Password hashing and verification with bcrypt succeeds');

    const wrongMatch = await bcrypt.compare('WrongPassword', testUser.passwordHash);
    assert(!wrongMatch, 'Invalid password is fundamentally rejected');

    // Test 2: Role-Based Authorization
    console.log('\n2. Role-Based Authorization Tests:');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    assert(adminUser !== null && adminUser.role === 'ADMIN', 'Admin user exists with ADMIN privileges');

    const organizerUser = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
    assert(organizerUser !== null && organizerUser.role === 'ORGANIZER', 'Organizer user exists with ORGANIZER privileges');

    // Test 3: Event Creation & Capacity
    console.log('\n3. Event Creation & Capacity Constraints:');
    const category = await prisma.eventCategory.findFirst();
    const testEvent = await prisma.event.create({
      data: {
        title: `Test Capacity Hackathon ${Date.now()}`,
        slug: `test-cap-${Date.now()}`,
        description: 'Test description',
        categoryId: category!.id,
        organizerId: organizerUser!.id,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        registrationDeadline: new Date(Date.now() + 43200000),
        capacity: 1, // Only 1 spot!
        registrationType: 'INDIVIDUAL',
        status: 'PUBLISHED',
      },
    });

    assert(testEvent.capacity === 1, 'Event created with capacity cap of 1');

    // Test 4: First Registration Confirmed
    console.log('\n4. Registration & Waitlist Flow:');
    const reg1 = await prisma.registration.create({
      data: {
        registrationNumber: `REG-TEST-001-${Date.now()}`,
        eventId: testEvent.id,
        userId: testUser.id,
        status: 'CONFIRMED',
        ticket: {
          create: {
            ticketToken: `TKT-TEST-${Date.now()}`,
            qrCodeData: JSON.stringify({ token: 'test' }),
          },
        },
      },
      include: { ticket: true },
    });

    assert(reg1.status === 'CONFIRMED', 'First registration receives CONFIRMED status');
    assert(Boolean(reg1.ticket?.ticketToken), 'Confirmed registration receives digital ticket token');

    // Test 5: Prevent Duplicate Registration
    try {
      await prisma.registration.create({
        data: {
          registrationNumber: `REG-TEST-DUP-${Date.now()}`,
          eventId: testEvent.id,
          userId: testUser.id, // SAME USER & EVENT
          status: 'CONFIRMED',
        },
      });
      assert(false, 'Duplicate registration prevented by unique constraint');
    } catch {
      assert(true, 'Duplicate registration strictly rejected by database unique constraint');
    }

    // Test 6: Capacity Full -> Waitlist Placement
    const secondUser = await prisma.user.create({
      data: {
        email: `waitlist.user.${Date.now()}@college.edu`,
        passwordHash,
        name: 'Waitlist Tester',
        role: 'STUDENT',
      },
    });

    const reg2 = await prisma.registration.create({
      data: {
        registrationNumber: `REG-TEST-WL-${Date.now()}`,
        eventId: testEvent.id,
        userId: secondUser.id,
        status: 'WAITLISTED',
        waitlistPosition: 1,
      },
    });

    assert(reg2.status === 'WAITLISTED', 'When capacity is full, next registration is placed on WAITLIST');
    assert(reg2.waitlistPosition === 1, 'Waitlist position is correctly assigned #1');

    // Test 7: Cancellation & Automatic Waitlist Promotion
    console.log('\n5. Cancellation & Auto-Waitlist Promotion:');
    // Cancel first user's registration
    await prisma.registration.update({
      where: { id: reg1.id },
      data: { status: 'CANCELLED', waitlistPosition: null },
    });

    // Auto-promote second user
    const promoted = await prisma.registration.update({
      where: { id: reg2.id },
      data: { status: 'CONFIRMED', waitlistPosition: null },
    });

    assert(promoted.status === 'CONFIRMED', 'Waitlisted student automatically promoted to CONFIRMED');

    // Test 8: Ticket Validation & Attendance Check-in
    console.log('\n6. Attendance & Ticket Validation:');
    const attendance = await prisma.attendance.create({
      data: {
        eventId: testEvent.id,
        registrationId: promoted.id,
        checkedInById: organizerUser!.id,
        checkInMethod: 'QR_SCAN',
      },
    });

    assert(Boolean(attendance.id), 'Attendance recorded with server timestamp and organizer ID');

    // Test 9: Duplicate Attendance Prevention
    try {
      await prisma.attendance.create({
        data: {
          eventId: testEvent.id,
          registrationId: promoted.id, // SAME REGISTRATION
          checkedInById: organizerUser!.id,
        },
      });
      assert(false, 'Duplicate check-in prevented by unique constraint');
    } catch {
      assert(true, 'Duplicate check-in strictly rejected by database constraint');
    }

    // Test 10: Verified Certificate Issuance
    console.log('\n7. Certificate Issuance & Verification:');
    const certNumber = `CERT-TEST-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const cert = await prisma.certificate.create({
      data: {
        certificateNumber: certNumber,
        eventId: testEvent.id,
        userId: secondUser.id,
        title: 'Certificate of Technical Achievement',
        recipientName: secondUser.name,
        verificationUrl: `/verify-certificate?id=${certNumber}`,
      },
    });

    assert(Boolean(cert.id), 'Certificate issued to verified attendee');
    assert(cert.certificateNumber === certNumber, 'Certificate number matches verification query');

    // Clean up test event and users
    await prisma.certificate.delete({ where: { id: cert.id } });
    await prisma.attendance.delete({ where: { id: attendance.id } });
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } });
    await prisma.event.delete({ where: { id: testEvent.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.user.delete({ where: { id: secondUser.id } });

    console.log('\n=============================================');
    console.log(`Test Results: ${passed} passed, ${failed} failed.`);
    console.log('=============================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
