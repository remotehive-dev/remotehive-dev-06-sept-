'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ANIMATION } from '@/lib/constants/admin';

interface FormFieldProps {
  label?: string;
  error?: string;
  success?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  description?: string;
}

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  description?: string;
  variant?: 'default' | 'glass' | 'minimal';
}

interface AnimatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  variant?: 'default' | 'glass' | 'minimal';
  autoResize?: boolean;
}

interface AnimatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  variant?: 'default' | 'glass' | 'minimal';
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

interface FileUploadProps {
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFileSelect: (files: File[]) => void;
  className?: string;
  variant?: 'default' | 'glass' | 'minimal';
  preview?: boolean;
}

interface PasswordInputProps extends Omit<AnimatedInputProps, 'type'> {
  showStrength?: boolean;
}

const variantClasses = {
  default: {
    input: 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20',
    label: 'text-gray-300',
    description: 'text-gray-400',
  },
  glass: {
    input: 'bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50 focus:border-white/40 focus:ring-white/10',
    label: 'text-white',
    description: 'text-white/70',
  },
  minimal: {
    input: 'bg-transparent border-0 border-b-2 border-gray-600 rounded-none text-white placeholder-gray-400 focus:border-blue-500 focus:ring-0 px-0',
    label: 'text-gray-300',
    description: 'text-gray-400',
  },
};

// Form Field Wrapper
export function FormField({
  label,
  error,
  success,
  required,
  className,
  children,
  description,
}: FormFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ANIMATION.FAST}
      className={cn('space-y-2', className)}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {description && !error && !success && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
      
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={ANIMATION.FAST}
            className="flex items-center gap-2 text-red-400 text-xs"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={ANIMATION.FAST}
            className="flex items-center gap-2 text-green-400 text-xs"
          >
            <CheckCircle className="h-3 w-3 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Animated Input
export function AnimatedInput({
  label,
  error,
  success,
  icon,
  rightIcon,
  description,
  variant = 'default',
  className,
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const styles = variantClasses[variant];

  return (
    <FormField
      label={label}
      error={error}
      success={success}
      required={props.required}
      description={description}
      className={className}
    >
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            'w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2',
            styles.input,
            icon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            success && 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
          )}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={ANIMATION.FAST}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
    </FormField>
  );
}

// Password Input with Strength Indicator
export function PasswordInput({
  showStrength = false,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (showStrength) {
      setStrength(calculateStrength(value));
    }
    props.onChange?.(e);
  };

  const strengthColors = {
    0: 'bg-gray-600',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500',
    5: 'bg-green-600',
  };

  const strengthLabels = {
    0: '',
    1: 'Very Weak',
    2: 'Weak',
    3: 'Fair',
    4: 'Good',
    5: 'Strong',
  };

  return (
    <div className="space-y-2">
      <AnimatedInput
        {...props}
        type={showPassword ? 'text' : 'password'}
        onChange={handleChange}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      
      {showStrength && props.value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-1"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <motion.div
                key={level}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  strength >= level ? strengthColors[strength as keyof typeof strengthColors] : 'bg-gray-600'
                )}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: level * 0.1 }}
              />
            ))}
          </div>
          {strength > 0 && (
            <p className="text-xs text-gray-400">
              Password strength: {strengthLabels[strength as keyof typeof strengthLabels]}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Animated Textarea
export function AnimatedTextarea({
  label,
  error,
  success,
  description,
  variant = 'default',
  autoResize = false,
  className,
  ...props
}: AnimatedTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const styles = variantClasses[variant];

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
    props.onInput?.(e);
  };

  return (
    <FormField
      label={label}
      error={error}
      success={success}
      required={props.required}
      description={description}
      className={className}
    >
      <motion.textarea
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onInput={handleInput}
        className={cn(
          'w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 resize-none',
          styles.input,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          success && 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
        )}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={ANIMATION.FAST}
      />
    </FormField>
  );
}

// Animated Select
export function AnimatedSelect({
  label,
  error,
  success,
  description,
  variant = 'default',
  options,
  placeholder,
  className,
  ...props
}: AnimatedSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const styles = variantClasses[variant];

  return (
    <FormField
      label={label}
      error={error}
      success={success}
      required={props.required}
      description={description}
      className={className}
    >
      <motion.select
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          'w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2',
          styles.input,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          success && 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
        )}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={ANIMATION.FAST}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </motion.select>
    </FormField>
  );
}

// File Upload Component
export function FileUpload({
  label,
  error,
  success,
  description,
  accept,
  multiple = false,
  maxSize = 10,
  onFileSelect,
  className,
  variant = 'default',
  preview = false,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    const validFiles = fileArray.filter((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        return false;
      }
      return true;
    });

    setFiles(validFiles);
    onFileSelect(validFiles);

    // Generate previews for images
    if (preview) {
      const newPreviews: string[] = [];
      validFiles.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push(e.target?.result as string);
            if (newPreviews.length === validFiles.filter(f => f.type.startsWith('image/')).length) {
              setPreviews(newPreviews);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileSelect(newFiles);
    
    if (preview) {
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
    }
  };

  return (
    <FormField
      label={label}
      error={error}
      success={success}
      description={description}
      className={className}
    >
      <motion.div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200',
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500',
          error && 'border-red-500',
          success && 'border-green-500'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        transition={ANIMATION.FAST}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-300 mb-1">
            {dragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            {accept && `Accepted formats: ${accept}`}
            {maxSize && ` • Max size: ${maxSize}MB`}
          </p>
        </label>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
              >
                {preview && previews[index] && (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-400 p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </FormField>
  );
}

// Export all form components
export {
  FormField,
  AnimatedInput as Input,
  PasswordInput,
  AnimatedTextarea as Textarea,
  AnimatedSelect as Select,
  FileUpload,
};