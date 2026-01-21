/**
 * Dynamic Open Graph Image Generator
 *
 * Generates custom OG images for shared content like notes, profiles, etc.
 * Uses @vercel/og for server-side image generation.
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'OpenPeople.ai';
    const description = searchParams.get('description') || 'Human-centric AI for business';
    const type = searchParams.get('type') || 'website'; // website, note, profile, etc.

    // Generate different layouts based on type
    let content;

    switch (type) {
      case 'note':
        content = generateNoteOG(title, description);
        break;
      case 'profile':
        content = generateProfileOG(title, description);
        break;
      default:
        content = generateDefaultOG(title, description);
    }

    return new ImageResponse(content, {
      width: 1200,
      height: 630,
    });
  } catch (error) {
    console.error('OG image generation failed:', error);

    // Fallback to a simple error image
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            color: '#00FF88',
            fontSize: '48px',
            fontFamily: 'Inter',
          }}
        >
          OpenPeople.ai
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}

function generateDefaultOG(title: string, description: string) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        fontFamily: 'Inter',
        padding: '60px',
      }}
    >
      {/* Header with logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#00FF88',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#000000',
          }}
        >
          OP
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#00FF88',
          }}
        >
          OpenPeople.ai
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '20px',
          lineHeight: '1.2',
          maxWidth: '800px',
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '24px',
          textAlign: 'center',
          opacity: 0.8,
          maxWidth: '700px',
          lineHeight: '1.4',
        }}
      >
        {description}
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '60px',
          right: '60px',
          height: '4px',
          backgroundColor: '#00FF88',
          borderRadius: '2px',
        }}
      />
    </div>
  );
}

function generateNoteOG(title: string, description: string) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        fontFamily: 'Inter',
        padding: '60px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#00FF88',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000000',
          }}
        >
          📝
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#00FF88',
          }}
        >
          Shared Note
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: '42px',
          fontWeight: '700',
          marginBottom: '20px',
          lineHeight: '1.2',
          maxWidth: '900px',
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '20px',
          opacity: 0.8,
          maxWidth: '800px',
          lineHeight: '1.4',
          marginBottom: '40px',
        }}
      >
        {description}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#00FF88',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#000000',
          }}
        >
          OP
        </div>
        <div
          style={{
            fontSize: '18px',
            color: '#00FF88',
            fontWeight: '500',
          }}
        >
          OpenPeople.ai
        </div>
      </div>
    </div>
  );
}

function generateProfileOG(title: string, description: string) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        fontFamily: 'Inter',
        padding: '60px',
      }}
    >
      {/* Profile avatar placeholder */}
      <div
        style={{
          width: '120px',
          height: '120px',
          backgroundColor: '#00FF88',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: '30px',
        }}
      >
        👤
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: '700',
          marginBottom: '20px',
          lineHeight: '1.2',
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '24px',
          opacity: 0.8,
          maxWidth: '700px',
          lineHeight: '1.4',
        }}
      >
        {description}
      </div>

      {/* Platform branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            color: '#00FF88',
            fontWeight: '500',
          }}
        >
          OpenPeople.ai
        </div>
        <div
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#00FF88',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000000',
          }}
        >
          OP
        </div>
      </div>
    </div>
  );
}