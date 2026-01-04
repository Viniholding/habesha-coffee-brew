import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormData = await req.json();

    console.log("Received contact form submission:", { name, email, subject });

    // Validate required fields
    if (!name || !email || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send notification email to Coffee Habesha
    const notificationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Coffee Habesha <onboarding@resend.dev>",
        to: ["info@coffeehabesha.com"],
        subject: `New Contact Form: ${subject || "General Inquiry"}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
          <hr />
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            Reply directly to this email to respond to the customer at ${email}
          </p>
        `,
        reply_to: email,
      }),
    });

    if (!notificationRes.ok) {
      const errorText = await notificationRes.text();
      console.error("Failed to send notification email:", errorText);
    } else {
      console.log("Notification email sent successfully");
    }

    // Send confirmation email to customer
    const confirmationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Coffee Habesha <onboarding@resend.dev>",
        to: [email],
        subject: "Thank you for contacting Coffee Habesha!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8B4513;">Thank You, ${name}!</h1>
            <p>We've received your message and appreciate you reaching out to Coffee Habesha.</p>
            <p>Our team will review your inquiry and get back to you within 24-48 business hours.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Message:</h3>
              <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
              <p>${message.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p>In the meantime, feel free to browse our premium Ethiopian coffee selection:</p>
            <p><a href="https://www.shop.coffeehabesha.com/shop-coffee-habesha/" style="color: #8B4513;">Shop Our Coffee</a></p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            <p style="color: #666; font-size: 14px;">
              Coffee Habesha - Love at First Sip<br />
              Premium Ethiopian Coffee
            </p>
          </div>
        `,
      }),
    });

    if (!confirmationRes.ok) {
      const errorText = await confirmationRes.text();
      console.error("Failed to send confirmation email:", errorText);
    } else {
      console.log("Confirmation email sent successfully");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-contact-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
