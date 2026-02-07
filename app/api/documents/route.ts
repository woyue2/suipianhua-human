import { NextResponse } from 'next/server';

/**
 * GET /api/documents
 *
 * Returns all documents metadata for listing.
 *
 * MVP Limitation:
 * Since this project uses IndexedDB (client-side storage),
 * this API endpoint returns an empty array as a placeholder.
 * Document listing should be handled client-side directly from IndexedDB.
 *
 * In a production app with true backend persistence:
 * - Use a real database (PostgreSQL, MongoDB, etc.)
 * - Implement proper authentication
 * - Store documents server-side
 */
export async function GET() {
  try {
    // MVP: Return empty array since IndexedDB is browser-only
    // Client-side should use documentDb.listDocuments() directly
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('[api/documents] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch documents',
      },
      { status: 500 }
    );
  }
}
