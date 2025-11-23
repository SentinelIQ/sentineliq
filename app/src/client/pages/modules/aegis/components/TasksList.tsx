import { Task } from '../types/aegis.types';
import { CheckCircle, Clock, Circle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Progress } from '../../../../components/ui/progress';
import { useState } from 'react';
import { cn } from '../../../../../lib/utils';

interface TasksListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  groupBy?: 'none' | 'group' | 'status';
  showProgress?: boolean;
  defaultView?: 'list' | 'timeline';
}

export function TasksList({ 
  tasks, 
  onTaskClick, 
  onStatusChange, 
  groupBy = 'group',
  showProgress = true,
  defaultView = 'list'
}: TasksListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>(defaultView);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const groupedTasks = () => {
    if (groupBy === 'none') {
      return { 'All Tasks': tasks };
    }

    const groups: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const key = groupBy === 'group' ? (task.group || 'Ungrouped') : task.status;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });

    // Sort tasks within each group by order
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.order - b.order);
    });

    return groups;
  };

  const calculateGroupProgress = (groupTasks: Task[]) => {
    const completed = groupTasks.filter(t => t.status === 'completed').length;
    return (completed / groupTasks.length) * 100;
  };

  const groups = groupedTasks();

  // Timeline/Gantt chart calculations
  const getTimelineData = () => {
    const tasksWithDates = tasks.filter(t => t.dueDate || t.completedAt);
    if (tasksWithDates.length === 0) return null;

    const dates = tasksWithDates.map(t => {
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      const completedDate = t.completedAt ? new Date(t.completedAt) : null;
      const startDate = t.startDate ? new Date(t.startDate) : null;
      return [startDate, dueDate, completedDate].filter(Boolean) as Date[];
    }).flat();

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    return { minDate, maxDate, totalDays };
  };

  const calculateTaskPosition = (task: Task, timelineData: ReturnType<typeof getTimelineData>) => {
    if (!timelineData) return null;
    
    const startDate = task.startDate ? new Date(task.startDate) : timelineData.minDate;
    const endDate = task.dueDate ? new Date(task.dueDate) : (task.completedAt ? new Date(task.completedAt) : timelineData.maxDate);
    
    const startOffset = Math.max(0, (startDate.getTime() - timelineData.minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const leftPercent = (startOffset / timelineData.totalDays) * 100;
    const widthPercent = (duration / timelineData.totalDays) * 100;

    return { leftPercent, widthPercent, startDate, endDate };
  };

  const timelineData = getTimelineData();

  return (
    <div className="space-y-4">
      {/* Timeline View */}
      {viewMode === 'timeline' && timelineData && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Timeline Header */}
              <div className="relative">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{timelineData.minDate.toLocaleDateString('pt-BR')}</span>
                  <span>{timelineData.maxDate.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="h-8 bg-muted/20 rounded relative">
                  {/* Week markers */}
                  {Array.from({ length: Math.ceil(timelineData.totalDays / 7) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-muted-foreground/20"
                      style={{ left: `${(i * 7 / timelineData.totalDays) * 100}%` }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {timelineData.totalDays} days
                  </div>
                </div>
              </div>

              {/* Tasks Timeline */}
              <div className="space-y-3">
                {Object.entries(groups).map(([groupName, groupTasks]) => (
                  <div key={groupName} className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">{groupName}</h4>
                    {groupTasks.map((task) => {
                      const position = calculateTaskPosition(task, timelineData);
                      if (!position) return null;

                      return (
                        <div
                          key={task.id}
                          className="relative h-12 group"
                        >
                          {/* Task bar */}
                          <div
                            className={cn(
                              "absolute top-1 h-10 rounded border-2 transition-all cursor-pointer",
                              task.status === 'completed' && "bg-green-500/20 border-green-500",
                              task.status === 'in_progress' && "bg-blue-500/20 border-blue-500",
                              task.status === 'waiting' && "bg-gray-500/20 border-gray-500",
                              task.status === 'cancelled' && "bg-red-500/20 border-red-500",
                              "hover:shadow-lg hover:z-10"
                            )}
                            style={{
                              left: `${position.leftPercent}%`,
                              width: `${position.widthPercent}%`,
                            }}
                            onClick={() => onTaskClick?.(task)}
                          >
                            <div className="px-2 py-1 flex items-center justify-between h-full overflow-hidden">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getStatusIcon(task.status)}
                                <span className="text-xs font-medium truncate">{task.title}</span>
                              </div>
                              <Badge variant={getPriorityColor(task.priority) as any} className="text-xs ml-2">
                                {task.priority}
                              </Badge>
                            </div>
                          </div>

                          {/* Tooltip on hover */}
                          <div className="absolute left-0 top-12 z-20 hidden group-hover:block bg-popover border rounded-lg shadow-lg p-3 min-w-[300px]">
                            <h5 className="font-semibold mb-1">{task.title}</h5>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                            )}
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</span>
                              </div>
                              {task.assignee && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Assignee:</span>
                                  <span>{task.assignee}</span>
                                </div>
                              )}
                              {task.estimatedHours && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Estimated:</span>
                                  <span>{task.estimatedHours}h</span>
                                </div>
                              )}
                              {task.actualHours && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Actual:</span>
                                  <span>{task.actualHours}h</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Period:</span>
                                <span>{position.startDate.toLocaleDateString('pt-BR')} - {position.endDate.toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && Object.entries(groups).map(([groupName, groupTasks]) => {
        const isCollapsed = collapsedGroups.has(groupName);
        const progress = calculateGroupProgress(groupTasks);

        return (
          <Card key={groupName}>
            <CardContent className="pt-6">
              {/* Group Header */}
              {groupBy !== 'none' && (
                <div 
                  className="flex items-center justify-between mb-4 cursor-pointer hover:bg-muted/50 p-2 rounded -m-2"
                  onClick={() => toggleGroup(groupName)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <h3 className="font-semibold text-lg">{groupName}</h3>
                    <Badge variant="secondary">{groupTasks.length}</Badge>
                  </div>
                  
                  {showProgress && !isCollapsed && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {groupTasks.filter(t => t.status === 'completed').length} / {groupTasks.length}
                      </span>
                      <div className="w-24">
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tasks List */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {groupTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "p-4 border rounded-lg transition-colors",
                        onTaskClick && "cursor-pointer hover:bg-muted/50",
                        task.status === 'completed' && "opacity-75"
                      )}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(task.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                "font-medium",
                                task.status === 'completed' && "line-through"
                              )}>
                                {task.title}
                              </h4>
                              <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                                {task.priority}
                              </Badge>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">{task.id}</span>
                              
                              {task.assignee && (
                                <span>Assignee: {task.assignee}</span>
                              )}
                              
                              {task.dueDate && (
                                <span>
                                  Due: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              
                              {task.estimatedHours && (
                                <span>Est: {task.estimatedHours}h</span>
                              )}
                              
                              {task.actualHours && (
                                <span>Actual: {task.actualHours}h</span>
                              )}

                              {task.dependencies && task.dependencies.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {task.dependencies.length} dependencies
                                </Badge>
                              )}
                            </div>

                            {task.completedAt && (
                              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                                ✓ Completed {new Date(task.completedAt).toLocaleString('pt-BR')}
                                {task.completedBy && ` by ${task.completedBy}`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Actions */}
                        {onStatusChange && task.status !== 'completed' && (
                          <div className="flex gap-1">
                            {task.status === 'waiting' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(task.id, 'in_progress');
                                }}
                              >
                                Start
                              </Button>
                            )}
                            {task.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(task.id, 'completed');
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
