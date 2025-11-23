/**
 * Shared Form Components - Reusable form components for Aegis module
 *
 * Common form elements that are used across multiple forms
 * to maintain consistency and reduce code duplication.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Calendar as CalendarIcon,
  User,
  Hash,
  Tag,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  File,
  Image,
  Video,
  FileArchive
} from 'lucide-react';

// Components
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Badge } from '../../../../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Progress } from '../../../../../components/ui/progress';
import { Calendar } from '../../../../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../../../../components/ui/command';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';

// Types
interface FileUploadProps {
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFilesChange: (files: File[]) => void;
  existingFiles?: string[];
  label?: string;
  description?: string;
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  label?: string;
}

interface UserSelectorProps {
  value: string | string[];
  onChange: (userId: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
}

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  showTime?: boolean;
}

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  steps: { label: string; description?: string }[];
  variant?: 'horizontal' | 'vertical';
}

interface HashGeneratorProps {
  file?: File;
  onHashGenerated?: (hash: string, algorithm: string) => void;
  algorithms?: string[];
}

/**
 * File Upload Component with drag & drop
 */
export function FileUpload({
  accept,
  multiple = false,
  maxSize = 50 * 1024 * 1024, // 50MB default
  onFilesChange,
  existingFiles = [],
  label = 'Upload Files',
  description = 'Drag and drop files here or click to browse'
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const { errors } = rejection;
          if (errors.find((e: any) => e.code === 'file-too-large')) {
            toast.error(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
          } else if (errors.find((e: any) => e.code === 'file-invalid-type')) {
            toast.error('Invalid file type');
          }
        });
      }

      if (acceptedFiles.length > 0) {
        const newFiles = [...selectedFiles, ...acceptedFiles];
        setSelectedFiles(newFiles);
        onFilesChange(newFiles);

        acceptedFiles.forEach((file) => {
          const fileId = `${file.name}-${file.size}`;
          setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

          const interval = setInterval(() => {
            setUploadProgress((prev) => {
              const currentProgress = prev[fileId] || 0;
              if (currentProgress >= 100) {
                clearInterval(interval);
                return prev;
              }
              return { ...prev, [fileId]: currentProgress + 10 };
            });
          }, 100);
        });
      }
    },
    [selectedFiles, maxSize, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize
  });

  const removeFile = (fileToRemove: File) => {
    const newFiles = selectedFiles.filter((file) => file !== fileToRemove);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);

    const fileId = `${fileToRemove.name}-${fileToRemove.size}`;
    setUploadProgress((prev) => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />;
    } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension || '')) {
      return <Video className="w-4 h-4" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <FileArchive className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />

        {isDragActive ? (
          <p className="text-sm">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">
              {accept ? `Accepted formats: ${Object.values(accept).flat().join(', ')}` : 'Any file type'}
            </p>
            <p className="text-xs text-muted-foreground">Max size: {maxSize / 1024 / 1024}MB</p>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files ({selectedFiles.length})</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file) => {
              const fileId = `${file.name}-${file.size}`;
              const progress = uploadProgress[fileId] || 0;

              return (
                <div key={fileId} className="flex items-center gap-3 p-2 border rounded">
                  {getFileIcon(file.name)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                    {progress > 0 && progress < 100 && <Progress value={progress} className="mt-1 h-1" />}
                    {progress === 100 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Uploaded
                      </div>
                    )}
                  </div>

                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Existing Files ({existingFiles.length})</Label>

          <div className="space-y-1">
            {existingFiles.map((fileName, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {getFileIcon(fileName)}
                <span className="text-muted-foreground">{fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/*  
-----------------------------------------------------------
TAG INPUT
-----------------------------------------------------------
*/

export function TagInput({
  value,
  onChange,
  placeholder = 'Add tags...',
  suggestions = [],
  maxTags = 20,
  label = 'Tags'
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();

    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return toast.error('Tag already exists');
    if (value.length >= maxTags) return toast.error(`Maximum ${maxTags} tags allowed`);

    onChange([...value, trimmedTag]);
    setInputValue('');
    setFilteredSuggestions([]);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    if (inputVal.trim()) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(inputVal.toLowerCase()) &&
          !value.includes(suggestion.toLowerCase())
      );

      setFilteredSuggestions(filtered.slice(0, 5));
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 min-h-[2.5rem] p-2 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          {value.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent"
            disabled={value.length >= maxTags}
          />

          {inputValue && (
            <Button type="button" size="sm" variant="ghost" onClick={() => handleAddTag(inputValue)}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-md">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                onClick={() => handleAddTag(suggestion)}
              >
                <Tag className="w-3 h-3 inline mr-2" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length}/{maxTags} tags {inputValue && '• Press Enter to add'}
      </p>
    </div>
  );
}

/*  
-----------------------------------------------------------
USER SELECTOR
-----------------------------------------------------------
*/

export function UserSelector({
  value,
  onChange,
  multiple = false,
  placeholder = 'Select user(s)...',
  label = 'Users'
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const users = [
    { id: '1', name: 'John Doe', email: 'john@company.com', avatar: '/avatars/john.jpg' },
    { id: '2', name: 'Jane Smith', email: 'jane@company.com', avatar: '/avatars/jane.jpg' },
    { id: '3', name: 'Mike Johnson', email: 'mike@company.com', avatar: '/avatars/mike.jpg' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', avatar: '/avatars/sarah.jpg' }
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedUsers = multiple
    ? users.filter((user) => (value as string[]).includes(user.id))
    : users.filter((user) => user.id === value);

  const handleSelect = (userId: string) => {
    if (multiple) {
      const currentValue = value as string[];
      const newValue = currentValue.includes(userId)
        ? currentValue.filter((id) => id !== userId)
        : [...currentValue, userId];

      onChange(newValue);
    } else {
      onChange(userId);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />

              {selectedUsers.length > 0 ? (
                <div className="flex items-center gap-1">
                  {multiple ? <span>{selectedUsers.length} user(s) selected</span> : selectedUsers[0].name}
                </div>
              ) : (
                placeholder
              )}
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." value={searchValue} onValueChange={setSearchValue} />
            <CommandEmpty>No users found.</CommandEmpty>

            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem key={user.id} onSelect={() => handleSelect(user.id)}>
                  <div className="flex items-center gap-3 w-full">
                    {multiple && (
                      <Checkbox
                        checked={(value as string[]).includes(user.id)}
                        onChange={() => handleSelect(user.id)}
                      />
                    )}

                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {multiple && selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {user.name}
              <button
                type="button"
                onClick={() => handleSelect(user.id)}
                className="ml-1 hover:bg-red-100 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/*  
-----------------------------------------------------------
DATETIME PICKER
-----------------------------------------------------------
*/

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  label = 'Date',
  showTime = false
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [timeValue, setTimeValue] = useState('');

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    if (showTime && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      date.setHours(hours, minutes);
    }

    onChange(date);
    if (!showTime) setOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);

    if (value) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />

            {value ? (
              showTime ? format(value, 'PPP p') : format(value, 'PPP')
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={handleDateSelect} initialFocus />

          {showTime && (
            <div className="p-3 border-t">
              <Label className="text-sm">Time</Label>
              <Input
                type="time"
                value={timeValue || (value ? format(value, 'HH:mm') : '')}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {showTime && (
            <div className="p-3 border-t">
              <Button onClick={() => setOpen(false)} className="w-full" size="sm">
                Done
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/*  
-----------------------------------------------------------
PROGRESS TRACKER
-----------------------------------------------------------
*/

export function ProgressTracker({
  currentStep,
  totalSteps,
  steps,
  variant = 'horizontal'
}: ProgressTrackerProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  if (variant === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 mt-2 ${
                      stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              <div className="flex-1 pt-1">
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>

                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progressPercentage)}% Complete</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber <= currentStep;

          return (
            <div key={index} className="text-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mx-auto ${
                  isCompleted ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>

              <p
                className={`text-xs mt-1 ${
                  stepNumber === currentStep ? 'text-blue-600 font-medium' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/*  
-----------------------------------------------------------
HASH GENERATOR
-----------------------------------------------------------
*/

export function HashGenerator({
  file,
  onHashGenerated,
  algorithms = ['md5', 'sha1', 'sha256']
}: HashGeneratorProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithms[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');

  const generateHash = async () => {
    if (!file) return;

    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockHash = Array.from(
        {
          length:
            selectedAlgorithm === 'md5'
              ? 32
              : selectedAlgorithm === 'sha1'
              ? 40
              : 64
        },
        () => Math.floor(Math.random() * 16).toString(16)
      ).join('');

      setGeneratedHash(mockHash);
      onHashGenerated?.(mockHash, selectedAlgorithm);
      toast.success(`${selectedAlgorithm.toUpperCase()} hash generated successfully`);
    } catch (error) {
      toast.error('Failed to generate hash');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyHash = () => {
    if (generatedHash) {
      navigator.clipboard.writeText(generatedHash);
      toast.success('Hash copied to clipboard');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Hash className="w-4 h-4" />
          File Hash Generator
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!file ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please select a file to generate hash</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {algorithms.map((algo) => (
                  <option key={algo} value={algo}>
                    {algo.toUpperCase()}
                  </option>
                ))}
              </select>

              <Button onClick={generateHash} disabled={isGenerating} size="sm">
                {isGenerating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Hash'
                )}
              </Button>
            </div>

            {generatedHash && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {selectedAlgorithm.toUpperCase()} Hash
                </Label>

                <div className="flex gap-2">
                  <Input value={generatedHash} readOnly className="font-mono text-xs" />

                  <Button onClick={copyHash} variant="outline" size="sm">
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
