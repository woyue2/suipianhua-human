import { NextRequest, NextResponse } from 'next/server';
import { promptManager } from '@/lib/prompts/manager';
import { promptValidationSchema, updatePromptSchema } from './validate';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let prompts;

    if (category) {
      prompts = promptManager.getPromptsByCategory(category);
    } else {
      const all = promptManager.getAllPrompts();
      prompts = all;
    }

    return NextResponse.json({
      success: true,
      data: prompts
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = promptValidationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        errors: validationResult.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const newPrompt = promptManager.addCustomPrompt({
      name: validationResult.data.name,
      description: validationResult.data.description || '',
      systemPrompt: validationResult.data.systemPrompt,
      category: validationResult.data.category,
      scenario: validationResult.data.scenario,
      temperature: validationResult.data.temperature,
      model: validationResult.data.model,
      outputFormat: validationResult.data.outputFormat
    });

    return NextResponse.json({
      success: true,
      data: newPrompt
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing prompt ID'
      }, { status: 400 });
    }

    const validationResult = updatePromptSchema.safeParse(updates);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        errors: validationResult.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const success = promptManager.updateCustomPrompt(id, validationResult.data);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Prompt not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt updated'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing prompt ID'
      }, { status: 400 });
    }

    const success = promptManager.deleteCustomPrompt(id);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Prompt not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
