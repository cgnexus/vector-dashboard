import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { JobManager } from '@/lib/jobs/cleanup.job';
import { AlertEvaluationJob } from '@/lib/jobs/alert-evaluation.job';
import { NotificationDeliveryJob } from '@/lib/jobs/notification-delivery.job';

// GET /api/admin/jobs - Get job status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, any authenticated user can view job status
    // In production, you might want to add admin role checking here
    
    const status = JobManager.getStatus();

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

// POST /api/admin/jobs - Start or restart jobs
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, jobName, config } = body;

    switch (action) {
      case 'start_all':
        JobManager.startAll(config);
        return NextResponse.json({
          success: true,
          message: 'All background jobs started'
        });

      case 'stop_all':
        JobManager.stopAll();
        return NextResponse.json({
          success: true,
          message: 'All background jobs stopped'
        });

      case 'restart_job':
        if (!jobName) {
          return NextResponse.json(
            { error: 'Job name is required for restart' },
            { status: 400 }
          );
        }
        JobManager.restartJob(jobName, config);
        return NextResponse.json({
          success: true,
          message: `Job ${jobName} restarted`
        });

      case 'run_once':
        if (!jobName) {
          return NextResponse.json(
            { error: 'Job name is required for run_once' },
            { status: 400 }
          );
        }

        let result;
        switch (jobName) {
          case 'alert_evaluation':
            result = await AlertEvaluationJob.execute();
            break;
          case 'notification_delivery':
            result = await NotificationDeliveryJob.execute();
            break;
          default:
            return NextResponse.json(
              { error: `Unknown job: ${jobName}` },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          message: `Job ${jobName} executed`,
          data: result
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing jobs:', error);
    return NextResponse.json(
      { error: 'Failed to manage jobs' },
      { status: 500 }
    );
  }
}