"use client";

import { useEffect, useState } from "react";
import { groupsApi } from "@/lib/api";
import { Group } from "@/lib/types/common";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { Plus } from "lucide-react";

interface GroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function GroupSelect({ value, onChange, label, placeholder }: GroupSelectProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const loadGroups = async () => {
    try {
      const res = await groupsApi.getAllGroups(1, 100);
      setGroups(res.data?.items ?? []);
    } catch (error) {
      console.error("Failed to load groups", error);
      setGroups([]);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    await groupsApi.createGroup({ name: newGroupName.trim() });
    setNewGroupName("");
    setIsModalOpen(false);
    await loadGroups();
  };

  return (
    <>
      <div className="flex gap-2">
        <Select
          label={label || "گروه"}
          placeholder={placeholder || "گروه را انتخاب کنید"}
          selectedKeys={value ? [value] : []}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          variant="bordered"
        >
          {groups.map((g) => (
            <SelectItem key={g.id} value={g.id.toString()}>
              {g.name}
            </SelectItem>
          ))}
        </Select>
        <Button
          isIconOnly
          color="primary"
          variant="flat"
          onPress={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>افزودن گروه جدید</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="نام گروه"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  انصراف
                </Button>
                <Button color="primary" onPress={handleAddGroup} isDisabled={!newGroupName.trim()}>
                  افزودن
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default GroupSelect;
