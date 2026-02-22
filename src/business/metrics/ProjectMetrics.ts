import type { Project } from '@/db/models/Project';
import type { Unit } from '@/db/models/Unit';
import type { ProjectMetricResult } from '../types';

export class ProjectMetrics {
  compute(project: Project, units: Unit[]): ProjectMetricResult {
    const todoCount = units.filter((u) => u.statusCategory === 'new').length;
    const inProgressCount = units.filter((u) => u.statusCategory === 'indeterminate').length;
    const doneCount = units.filter((u) => u.statusCategory === 'done').length;
    const totalIssues = units.length;

    return {
      projectKey: project.jiraKey,
      projectName: project.projectName,
      totalIssues,
      todoCount,
      inProgressCount,
      doneCount,
      progressPercent: totalIssues > 0 ? Math.round((doneCount / totalIssues) * 100) : 0,
    };
  }
}
