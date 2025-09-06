'use client';

import React from 'react';
import { 
  Task, 
  TaskTrigger, 
  TaskContent, 
  TaskItem, 
  TaskItemFile, 
  TaskList 
} from './task';
import { FileText, Code, Settings } from 'lucide-react';

// Basic Task example
export function BasicTaskExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Task Example</h3>
      
      <Task status="pending" defaultOpen={true}>
        <TaskTrigger title="Project Setup" status="pending" />
        <TaskContent>
          <TaskItem status="completed">
            Initialize project with npm
          </TaskItem>
          <TaskItem status="completed">
            Install dependencies
          </TaskItem>
          <TaskItem status="in_progress">
            Configure build tools
          </TaskItem>
          <TaskItem status="pending">
            Set up development environment
          </TaskItem>
        </TaskContent>
      </Task>

      <Task status="in_progress">
        <TaskTrigger title="Component Development" status="in_progress" />
        <TaskContent>
          <TaskItem status="completed">
            Create component structure
          </TaskItem>
          <TaskItem status="in_progress">
            Implement core functionality
          </TaskItem>
          <TaskItem status="pending">
            Add styling and animations
          </TaskItem>
          <TaskItem status="pending">
            Write unit tests
          </TaskItem>
        </TaskContent>
      </Task>

      <Task status="completed">
        <TaskTrigger title="Documentation" status="completed" />
        <TaskContent>
          <TaskItem status="completed">
            Write API documentation
          </TaskItem>
          <TaskItem status="completed">
            Create usage examples
          </TaskItem>
          <TaskItem status="completed">
            Update README
          </TaskItem>
        </TaskContent>
      </Task>
    </div>
  );
}

// Task with files example
export function TaskWithFilesExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Task with Files Example</h3>
      
      <Task status="in_progress" defaultOpen={true}>
        <TaskTrigger title="Code Review" status="in_progress" />
        <TaskContent>
          <TaskItem status="completed">
            Review <TaskItemFile icon={<FileText className="h-4 w-4" />}>package.json</TaskItemFile>
          </TaskItem>
          <TaskItem status="in_progress">
            Review <TaskItemFile icon={<Code className="h-4 w-4" />}>src/components/Task.tsx</TaskItemFile>
          </TaskItem>
          <TaskItem status="pending">
            Review <TaskItemFile icon={<Settings className="h-4 w-4" />}>tailwind.config.js</TaskItemFile>
          </TaskItem>
          <TaskItem status="pending">
            Review <TaskItemFile icon={<FileText className="h-4 w-4" />}>README.md</TaskItemFile>
          </TaskItem>
        </TaskContent>
      </Task>
    </div>
  );
}

// TaskList example
export function TaskListExample() {
  const tasks = [
    {
      id: '1',
      title: 'Project Setup',
      status: 'completed' as const,
      items: [
        { id: '1-1', text: 'Initialize project', status: 'completed' as const },
        { id: '1-2', text: 'Install dependencies', status: 'completed' as const },
        { id: '1-3', text: 'Configure build tools', status: 'completed' as const }
      ]
    },
    {
      id: '2',
      title: 'Component Development',
      status: 'in_progress' as const,
      items: [
        { id: '2-1', text: 'Create component structure', status: 'completed' as const },
        { id: '2-2', text: 'Implement core functionality', status: 'in_progress' as const },
        { id: '2-3', text: 'Add styling', status: 'pending' as const },
        { id: '2-4', text: 'Write tests', status: 'pending' as const }
      ]
    },
    {
      id: '3',
      title: 'Documentation',
      status: 'pending' as const,
      items: [
        { id: '3-1', text: 'Write API docs', status: 'pending' as const },
        { id: '3-2', text: 'Create examples', status: 'pending' as const }
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">TaskList Example</h3>
      
      <TaskList tasks={tasks} showProgress={true} />
    </div>
  );
}

// Complete example combining all features
export function CompleteTaskExample() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Task Component Examples</h2>
      
      <BasicTaskExample />
      
      <TaskWithFilesExample />
      
      <TaskListExample />
    </div>
  );
}
