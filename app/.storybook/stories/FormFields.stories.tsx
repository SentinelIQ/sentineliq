import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { InputField, TextareaField, SelectField, CheckboxField } from '../../src/client/components/FormFields';
import { Button } from '../../src/client/components/ui/button';

const meta: Meta = {
  title: 'Components/FormFields',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  plan: z.enum(['hobby', 'pro', 'enterprise']),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

type FormValues = z.infer<typeof formSchema>;

function FormExample() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      description: '',
      plan: 'hobby',
      terms: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = (data: FormValues) => {
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-[500px] space-y-6">
        <InputField
          name="name"
          label="Name"
          placeholder="Enter your name"
          required
        />

        <InputField
          name="email"
          label="Email"
          type="email"
          placeholder="name@example.com"
          required
        />

        <TextareaField
          name="description"
          label="Description"
          placeholder="Tell us about yourself..."
          description="Optional: Share a brief description"
        />

        <SelectField
          name="plan"
          label="Plan"
          options={[
            { value: 'hobby', label: 'Hobby' },
            { value: 'pro', label: 'Pro' },
            { value: 'enterprise', label: 'Enterprise' },
          ]}
          placeholder="Select a plan"
          required
        />

        <CheckboxField
          name="terms"
          label="I accept the terms and conditions"
          required
        />

        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </FormProvider>
  );
}

export const CompleteForm: StoryObj = {
  render: () => <FormExample />,
};

function InputFieldExample() {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
      })
    ),
    mode: 'onBlur',
  });

  return (
    <FormProvider {...form}>
      <form className="w-[400px] space-y-4">
        <InputField
          name="username"
          label="Username"
          placeholder="Enter username"
          description="Choose a unique username"
          required
        />
      </form>
    </FormProvider>
  );
}

export const InputFieldOnly: StoryObj = {
  render: () => <InputFieldExample />,
};

function TextareaExample() {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        message: z.string().min(10, 'Message must be at least 10 characters'),
      })
    ),
    mode: 'onBlur',
  });

  return (
    <FormProvider {...form}>
      <form className="w-[400px] space-y-4">
        <TextareaField
          name="message"
          label="Message"
          placeholder="Type your message here..."
          rows={6}
          required
        />
      </form>
    </FormProvider>
  );
}

export const TextareaOnly: StoryObj = {
  render: () => <TextareaExample />,
};

function SelectExample() {
  const form = useForm({
    defaultValues: { country: '' },
  });

  return (
    <FormProvider {...form}>
      <form className="w-[400px] space-y-4">
        <SelectField
          name="country"
          label="Country"
          options={[
            { value: 'us', label: 'United States' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'ca', label: 'Canada' },
            { value: 'au', label: 'Australia' },
            { value: 'br', label: 'Brazil' },
          ]}
          placeholder="Select your country"
          required
        />
      </form>
    </FormProvider>
  );
}

export const SelectOnly: StoryObj = {
  render: () => <SelectExample />,
};

function CheckboxExample() {
  const form = useForm({
    defaultValues: {
      marketing: false,
      newsletter: false,
    },
  });

  return (
    <FormProvider {...form}>
      <form className="w-[400px] space-y-4">
        <CheckboxField
          name="marketing"
          label="Send me marketing emails"
          description="Receive updates about new features and promotions"
        />
        <CheckboxField
          name="newsletter"
          label="Subscribe to newsletter"
          description="Weekly digest of product updates"
        />
      </form>
    </FormProvider>
  );
}

export const CheckboxesOnly: StoryObj = {
  render: () => <CheckboxExample />,
};

function ValidationExample() {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
      })
    ),
    mode: 'onBlur',
  });

  return (
    <FormProvider {...form}>
      <form className="w-[400px] space-y-4">
        <InputField
          name="password"
          label="Password"
          type="password"
          placeholder="Enter password"
          required
        />
        <InputField
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm password"
          required
        />
        <Button type="submit" onClick={form.handleSubmit((data) => alert('Valid!'))}>
          Validate
        </Button>
      </form>
    </FormProvider>
  );
}

export const WithValidation: StoryObj = {
  render: () => <ValidationExample />,
};
