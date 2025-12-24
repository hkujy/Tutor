import { Resend } from 'resend';
import { logger, logError } from '@/lib/logger/structured-logger';

/**
 * Email Service using Resend
 * Handles email sending with retry logic and delivery tracking
 */

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  /**
   * Send email with retry logic
   */
  async sendEmail(params: EmailParams, correlationId?: string): Promise<EmailResult> {
    const from = params.from || process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await resend.emails.send({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          replyTo: params.replyTo,
          attachments: params.attachments,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Log successful delivery
        if (correlationId) {
          logger.child({ correlationId }).info({
            type: 'email_sent',
            to: params.to,
            subject: params.subject,
            messageId: result.data?.id,
            attempt,
          });
        }

        return {
          success: true,
          messageId: result.data?.id,
        };
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries;

        if (correlationId) {
          logError(correlationId, error as Error, {
            type: 'email_send_failed',
            to: params.to,
            subject: params.subject,
            attempt,
            willRetry: !isLastAttempt,
          });
        }

        if (isLastAttempt) {
          return {
            success: false,
            error: (error as Error).message,
          };
        }

        // Exponential backoff: 1s, 2s, 4s
        await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
    };
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(
    appointment: any,
    correlationId?: string
  ): Promise<EmailResult> {
    const studentEmail = appointment.student.user.email;
    const tutorName = `${appointment.tutor.user.firstName} ${appointment.tutor.user.lastName}`;
    const startTime = new Date(appointment.startTime).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .details { background: white; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Appointment Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${appointment.student.user.firstName},</p>
              <p>Your tutoring session has been successfully scheduled.</p>
              
              <div class="details">
                <h3>Appointment Details</h3>
                <p><strong>Tutor:</strong> ${tutorName}</p>
                <p><strong>Subject:</strong> ${appointment.subject}</p>
                <p><strong>Date & Time:</strong> ${startTime}</p>
                ${appointment.zoomLink ? `<p><strong>Meeting Link:</strong> <a href="${appointment.zoomLink}">${appointment.zoomLink}</a></p>` : ''}
              </div>

              <a href="${process.env.NEXTAUTH_URL}/appointments/${appointment.id}" class="button">
                View Appointment Details
              </a>

              <p>You'll receive a reminder 24 hours before your session.</p>
            </div>
            <div class="footer">
              <p>Tutoring Calendar | <a href="${process.env.NEXTAUTH_URL}/settings">Manage Notifications</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      {
        to: studentEmail,
        subject: `Appointment Confirmed - ${appointment.subject} with ${tutorName}`,
        html,
      },
      correlationId
    );
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(
    appointment: any,
    hoursUntil: number,
    correlationId?: string
  ): Promise<EmailResult> {
    const studentEmail = appointment.student.user.email;
    const tutorName = `${appointment.tutor.user.firstName} ${appointment.tutor.user.lastName}`;
    const startTime = new Date(appointment.startTime).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const timeText = hoursUntil === 24 ? 'tomorrow' : `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #ff9800; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .details { background: white; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Upcoming Appointment Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${appointment.student.user.firstName},</p>
              <p>This is a reminder that you have a tutoring session <strong>${timeText}</strong>.</p>
              
              <div class="details">
                <h3>Appointment Details</h3>
                <p><strong>Tutor:</strong> ${tutorName}</p>
                <p><strong>Subject:</strong> ${appointment.subject}</p>
                <p><strong>Date & Time:</strong> ${startTime}</p>
                ${appointment.zoomLink ? `<p><strong>Meeting Link:</strong> <a href="${appointment.zoomLink}">Join Meeting</a></p>` : ''}
              </div>

              <a href="${process.env.NEXTAUTH_URL}/appointments/${appointment.id}" class="button">
                View Appointment
              </a>

              <p>Need to reschedule? Please contact your tutor as soon as possible.</p>
            </div>
            <div class="footer">
              <p>Tutoring Calendar | <a href="${process.env.NEXTAUTH_URL}/settings">Manage Notifications</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      {
        to: studentEmail,
        subject: `Reminder: ${appointment.subject} session ${timeText}`,
        html,
      },
      correlationId
    );
  }

  /**
   * Send assignment due reminder
   */
  async sendAssignmentDueReminder(
    assignment: any,
    correlationId?: string
  ): Promise<EmailResult> {
    const studentEmail = assignment.student.user.email;
    const dueDate = new Date(assignment.dueDate).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .details { background: white; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Assignment Due Soon</h1>
            </div>
            <div class="content">
              <p>Hi ${assignment.student.user.firstName},</p>
              <p>This is a reminder that your assignment is due soon.</p>
              
              <div class="details">
                <h3>Assignment Details</h3>
                <p><strong>Title:</strong> ${assignment.title}</p>
                <p><strong>Subject:</strong> ${assignment.subject || 'N/A'}</p>
                <p><strong>Due Date:</strong> ${dueDate}</p>
                <p><strong>Status:</strong> ${assignment.status}</p>
              </div>

              <a href="${process.env.NEXTAUTH_URL}/assignments" class="button">
                View Assignment
              </a>

              <p>Make sure to submit your work before the deadline!</p>
            </div>
            <div class="footer">
              <p>Tutoring Calendar | <a href="${process.env.NEXTAUTH_URL}/settings">Manage Notifications</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      {
        to: studentEmail,
        subject: `Reminder: "${assignment.title}" is due soon`,
        html,
      },
      correlationId
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const emailService = new EmailService();
