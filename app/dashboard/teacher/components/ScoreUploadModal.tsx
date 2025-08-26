"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { Upload } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: number | null;
}

export function ScoreUploadModal({ isOpen, onClose, groupId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!groupId || !file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setIsUploading(true);
      await api.uploadGroupScoresExcel(groupId, formData);
      toast.success("نمرات با موفقیت بارگذاری شد");
      setFile(null);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "خطا در بارگذاری فایل");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              آپلود نمرات از فایل اکسل
            </ModalHeader>
            <ModalBody>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                startContent={<Upload className="w-4 h-4 text-primary" />}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                انصراف
              </Button>
              <Button
                color="primary"
                onPress={handleUpload}
                isDisabled={!file || isUploading}
                isLoading={isUploading}
              >
                آپلود
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

