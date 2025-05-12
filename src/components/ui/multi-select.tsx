
import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  value: Option[];
  onChange: (options: Option[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled = false
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (option: Option) => {
    onChange(value.filter((item) => item.value !== option.value));
  };

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && value.length > 0) {
            const newValue = [...value];
            newValue.pop();
            onChange(newValue);
          }
        }
        // This helps prevent the command menu from closing when backspace is pressed
        if (e.key === "Backspace" && input.value !== "") {
          e.stopPropagation();
        }
      }
    },
    [value, onChange]
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-white border rounded-md"
    >
      <div
        className={`group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"
        }`}
        onClick={() => !disabled && setOpen(true)}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((option) => (
            <Badge key={option.value} variant="secondary">
              {option.label}
              {!disabled && (
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUnselect(option);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {!disabled && (
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={value.length === 0 ? placeholder : ""}
              disabled={disabled}
              className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
            />
          )}
        </div>
      </div>
      {open && !disabled && (
        <div className="relative mt-2">
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-[200px] overflow-auto">
              {options.map((option) => {
                const isSelected = value.some((item) => item.value === option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      if (isSelected) {
                        onChange(value.filter((item) => item.value !== option.value));
                      } else {
                        onChange([...value, option]);
                      }
                    }}
                    className={`cursor-pointer ${isSelected ? "bg-accent text-accent-foreground" : ""}`}
                  >
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        </div>
      )}
    </Command>
  );
}
