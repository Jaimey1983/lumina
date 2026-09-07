import { Search } from "lucide-react";
import { Input, InputWrapper } from "@lumina/ui/input";

export function SidebarSearch() {
  const handleInputChange = () => {};

  return (
    <div className="p-5 border-b border-border shrink-0">
      <InputWrapper>
        <Search />
        <Input type="search" placeholder="Search" onChange={handleInputChange} />
      </InputWrapper>
    </div>
  );
}
