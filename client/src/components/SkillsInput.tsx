import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  className?: string;
}

const SkillsInput: React.FC<SkillsInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Add a skill...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState<string>("");

  const addSkill = () => {
    const skill = inputValue.trim();
    if (skill && !value.includes(skill)) {
      onChange([...value, skill]);
      setInputValue("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <Input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          onKeyDown={handleKeyDown}
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={addSkill}
        >
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {value.map((skill) => (
          <Badge 
            key={skill} 
            className="pr-1.5 flex items-center"
            variant="secondary"
          >
            {skill}
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => removeSkill(skill)} 
              className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        {value.length === 0 && (
          <div className="text-xs text-slate-500">No skills added yet</div>
        )}
      </div>
    </div>
  );
};

export default SkillsInput;