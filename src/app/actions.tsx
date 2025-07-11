'use server';

import {
  findCompanyContacts,
  type FindCompanyContactsInput,
} from '@/ai/flows/find-company-contacts';
import {
  summarizeEmailPerformance,
  type SummarizeEmailPerformanceInput,
} from '@/ai/flows/summarize-email-performance';
import { HighTechTemplate } from '@/components/email/high-tech-template';
import { Resend } from 'resend';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Email sending will be disabled.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// --- Authentication Actions ---

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const SESSION_COOKIE_NAME = 'session';

export async function loginAction(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!result.success) {
    return { success: false, error: 'Invalid form data.' };
  }

  const { username, password } = result.data;

  // Hardcoded credentials as requested
  if (username === 'Ultron' && password === 'Singha@007') {
    const sessionToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    cookies().set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
  } else {
    return { success: false, error: 'Invalid username or password.' };
  }
  redirect('/dashboard');
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/');
}

// --- Email Campaign Actions ---

export type Recipient = {
  email: string;
  name: string;
};

export async function findContactsAction(input: FindCompanyContactsInput) {
  try {
    const result = await findCompanyContacts(input);
    return { success: true, contacts: result.contacts };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to find contacts.' };
  }
}

export async function sendEmailAction(
  recipient: Recipient,
  subject: string,
  bodyTemplate: string,
  fromEmail: string
) {
  if (!resend) {
    throw new Error(
      'Resend is not configured. Cannot send emails. Please set RESEND_API_KEY.'
    );
  }

  const personalizedBody = bodyTemplate
    .replace(/{{name}}/gi, recipient.name || 'there')
    .replace(/{{companyName}}/gi, 'their company');

  const emailHtml = HighTechTemplate({
    name: recipient.name,
    content: personalizedBody,
  });

  try {
    await resend.emails.send({
      from: `Team <${fromEmail}>`,
      to: [recipient.email],
      subject: subject,
      html: emailHtml,
    });
    return { email: recipient.email, status: 'Sent' as const };
  } catch (e: any) {
    return {
      email: recipient.email,
      status: 'Failed' as const,
      error: e.message,
    };
  }
}

export async function getSummaryAction(input: SummarizeEmailPerformanceInput) {
  try {
    const result = await summarizeEmailPerformance(input);
    return { success: true, summary: result.summary };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: 'Failed to generate performance summary.',
    };
  }
}
