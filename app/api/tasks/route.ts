import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, desc, assignee, roleTag, deadline } = body;
    if (!title || !assignee) {
      return NextResponse.json({ error: '제목과 담당자는 필수입니다.' }, { status: 400 });
    }
    const newTask = await prisma.task.create({
      data: {
        title,
        desc: desc || '',
        assignee,
        roleTag: roleTag || '👑팀장',
        status: 'TODO',
        deadline: deadline || 'D-Day'
      }
    });
    return NextResponse.json(newTask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status }
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, desc, assignee, roleTag, deadline } = body;
    if (!id || !title || !assignee) {
      return NextResponse.json({ error: '필수 값이 부족합니다.' }, { status: 400 });
    }
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        desc: desc || '',
        assignee,
        roleTag: roleTag || '👑팀장',
        deadline: deadline || 'D-Day'
      }
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to edit task' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID가 없습니다.' }, { status: 400 });
    }
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
