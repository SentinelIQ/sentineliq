import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

interface InputFieldProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
}

interface TextareaFieldProps extends FormFieldProps {
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

interface SelectFieldProps extends FormFieldProps {
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

interface CheckboxFieldProps extends FormFieldProps {
  disabled?: boolean;
}

export function FormField({ 
  name, 
  label, 
  description, 
  required, 
  className,
  children 
}: FormFieldProps & { children: React.ReactNode }) {
  const { formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
}

export function InputField({ 
  name, 
  label, 
  description, 
  required, 
  type = 'text',
  placeholder,
  disabled,
  className 
}: InputFieldProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} description={description} required={required} className={className}>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        aria-required={required}
        aria-invalid={!!required}
      />
    </FormField>
  );
}

export function TextareaField({ 
  name, 
  label, 
  description, 
  required, 
  placeholder,
  rows = 4,
  disabled,
  className 
}: TextareaFieldProps) {
  const { register } = useFormContext();

  return (
    <FormField name={name} label={label} description={description} required={required} className={className}>
      <Textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        {...register(name)}
        aria-required={required}
        aria-invalid={!!required}
      />
    </FormField>
  );
}

export function SelectField({ 
  name, 
  label, 
  description, 
  required,
  options,
  placeholder = 'Select an option',
  disabled,
  className 
}: SelectFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField name={name} label={label} description={description} required={required} className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger id={name} aria-required={required}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}

export function CheckboxField({ 
  name, 
  label, 
  description, 
  required,
  disabled,
  className 
}: CheckboxFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField name={name} label={label} description={description} required={required} className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={name}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-required={required}
            />
            {label && (
              <Label 
                htmlFor={name} 
                className="text-sm font-normal cursor-pointer"
              >
                {label}
              </Label>
            )}
          </div>
        )}
      />
    </FormField>
  );
}
