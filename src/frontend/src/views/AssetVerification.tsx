import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { backendService } from "../services/backendService";
import { fileService, FileMetadata } from "../services/fileService";
import {
  AssetVerificationData,
  VerificationProgressStep,
  AIVerificationSummary,
  ASSET_TYPES,
  getRiskIndicator,
} from "../types/identity";

const AssetVerification = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationRequestId, setVerificationRequestId] = useState<
    string | null
  >(null);
  const [verificationStatus, setVerificationStatus] =
    useState<AIVerificationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<AssetVerificationData>({
    assetId: "",
    assetType: "other",
    description: "",
    value: undefined,
    location: "",
    documents: [],
    metadata: {},
  });

  const steps: VerificationProgressStep[] = [
    {
      step: 1,
      title: "Asset Details",
      description: "Provide basic information about your asset",
      status:
        currentStep === 1
          ? "current"
          : currentStep > 1
            ? "completed"
            : "pending",
    },
    {
      step: 2,
      title: "Documentation",
      description: "Upload supporting documents",
      status:
        currentStep === 2
          ? "current"
          : currentStep > 2
            ? "completed"
            : "pending",
    },
    {
      step: 3,
      title: "AI Validation",
      description: "AI analyzes your submission",
      status:
        currentStep === 3
          ? "current"
          : currentStep > 3
            ? "completed"
            : "pending",
    },
    {
      step: 4,
      title: "Cross-Chain Confirmation",
      description: "Verification recorded on blockchain",
      status:
        currentStep === 4
          ? "current"
          : currentStep > 4
            ? "completed"
            : "pending",
    },
  ];

  // Generate a unique asset ID
  useEffect(() => {
    if (!formData.assetId) {
      const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setFormData((prev) => ({ ...prev, assetId }));
    }
  }, []);

  // Poll for verification results
  useEffect(() => {
    if (verificationRequestId && currentStep === 3) {
      const pollInterval = setInterval(async () => {
        try {
          const verification = await backendService.getAssetVerificationStatus(
            formData.assetId,
          );

          if (
            verification.verification_status === "Completed" &&
            verification.fraud_score !== null
          ) {
            setVerificationStatus({
              requestId: verificationRequestId,
              status: verification.verification_status,
              fraudScore: verification.fraud_score[0] || 0,
              confidenceLevel: verification.confidence_level[0] || 0,
              humanReviewRequired: verification.human_review_required,
              processedAt: new Date(
                Number(verification.verification_requested_at) / 1000000,
              ),
              completedAt: verification.verification_completed_at
                ? new Date(
                    Number(verification.verification_completed_at) / 1000000,
                  )
                : undefined,
              recommendations: [], // Would come from AI result
            });

            setCurrentStep(4);
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error("Error polling verification status:", err);
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [verificationRequestId, currentStep, formData.assetId]);

  const handleInputChange = (
    field: keyof AssetVerificationData,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file
        const validation = fileService.validateFile(file);
        if (!validation.valid) {
          throw new Error(`${file.name}: ${validation.error}`);
        }

        // Upload file with asset association
        const response = await fileService.uploadFile(
          file,
          formData.assetId,
          undefined, // identity_id (optional)
          ['asset-verification'] // tags
        );

        // Get uploaded file metadata
        const metadata = await fileService.getFileMetadata(response.file_id);
        return metadata;
      });

      const uploadedMetadata = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedMetadata]);
      
      // Update form data with uploaded files (keep for compatibility)
      setFormData((prev) => ({ 
        ...prev, 
        documents: [...(prev.documents || []), ...files] 
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const validateStep1 = (): boolean => {
    return !!(formData.assetType && formData.description && formData.value);
  };

  const validateStep2 = (): boolean => {
    return uploadedFiles.length > 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      setError("Please fill in all required fields");
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      setError("Please upload at least one document");
      return;
    }

    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleSubmitVerification = async () => {
    if (!validateStep1() || !validateStep2()) {
      setError("Please complete all required steps");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get user's first identity (in a real app, let user select)
      const identities = await backendService.getMyIdentities();
      if (identities.length === 0) {
        throw new Error("No identity found. Please create an identity first.");
      }

      const identityId = identities[0].id;

      // Prepare asset data for AI verification
      const assetData = JSON.stringify({
        type: formData.assetType,
        description: formData.description,
        value: formData.value,
        location: formData.location,
        timestamp: Date.now(),
        documentCount: uploadedFiles.length,
        fileIds: uploadedFiles.map(f => f.file_id),
        ...formData.metadata,
      });

      // Submit for verification
      const requestId = await backendService.linkAssetWithVerification(
        identityId,
        formData.assetId,
        formData.assetType,
        assetData,
      );

      setVerificationRequestId(requestId);
      setCurrentStep(3);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit verification",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "current":
        return "bg-blue-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <Layout>
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="tracking-light text-[32px] leading-tight font-bold text-white">
            Asset Verification
          </h1>
          {verificationRequestId && (
            <div className="text-sm text-gray-400">
              Request ID: {verificationRequestId.substring(0, 12)}...
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between gap-6">
            <p className="text-base font-medium text-white">
              Verification Progress
            </p>
            <p className="text-sm text-gray-400">Step {currentStep} of 4</p>
          </div>
          <div className="h-2 rounded bg-[#3b4754]">
            <div
              className="h-2 rounded bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Step indicators */}
          <div className="mt-2 flex justify-between">
            {steps.map((step) => (
              <div
                key={step.step}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className={`h-8 w-8 rounded-full ${getStepColor(step.status)} flex items-center justify-center text-sm font-bold text-white`}
                >
                  {step.step}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-600 bg-red-900/50 p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Asset Details */}
        {currentStep === 1 && (
          <div className="rounded-lg bg-[#1b2127] p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              Step 1: Asset Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="flex flex-col">
                  <p className="pb-2 text-base font-medium text-white">
                    Asset Type *
                  </p>
                  <select
                    className="form-select h-14 rounded-lg border border-[#3b4754] bg-[#1b2127] px-4 text-white"
                    value={formData.assetType}
                    onChange={(e) =>
                      handleInputChange("assetType", e.target.value as any)
                    }
                  >
                    {ASSET_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label className="flex flex-col">
                  <p className="pb-2 text-base font-medium text-white">
                    Asset Value (USD) *
                  </p>
                  <input
                    type="number"
                    className="form-input h-14 rounded-lg border border-[#3b4754] bg-[#1b2127] px-4 text-white"
                    placeholder="Enter asset value"
                    value={formData.value || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "value",
                        parseFloat(e.target.value) || undefined,
                      )
                    }
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="flex flex-col">
                  <p className="pb-2 text-base font-medium text-white">
                    Asset Description *
                  </p>
                  <textarea
                    className="form-textarea h-24 resize-none rounded-lg border border-[#3b4754] bg-[#1b2127] p-4 text-white"
                    placeholder="Describe your asset in detail..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="flex flex-col">
                  <p className="pb-2 text-base font-medium text-white">
                    Location (Optional)
                  </p>
                  <input
                    className="form-input h-14 rounded-lg border border-[#3b4754] bg-[#1b2127] px-4 text-white"
                    placeholder="Asset location"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                onClick={handleNext}
                disabled={!validateStep1()}
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Documentation */}
        {currentStep === 2 && (
          <div className="rounded-lg bg-[#1b2127] p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              Step 2: Documentation
            </h3>

            <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-[#3b4754] p-8">
              <div className="text-center">
                <p className="mb-2 text-lg font-bold text-white">
                  Upload Documents
                </p>
                <p className="mb-4 text-sm text-gray-400">
                  Upload documents to verify your asset. Accepted formats: PDF,
                  JPG, PNG.
                </p>
              </div>

              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />

              <label
                htmlFor="file-upload"
                className={`cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors ${
                  isUploading 
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-[#283039] hover:bg-[#3b4754]'
                }`}
              >
                {isUploading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Uploading...
                  </>
                ) : (
                  'Browse Files'
                )}
              </label>

              {uploadedFiles.length > 0 && (
                <div className="w-full">
                  <p className="mb-2 font-medium text-white">Uploaded Files:</p>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.file_id}
                        className="flex items-center justify-between rounded bg-[#283039] p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {fileService.getFileTypeIcon(file.mime_type)}
                          </span>
                          <span className="text-gray-300">{file.original_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {fileService.formatFileSize(Number(file.size))}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await fileService.deleteFile(file.file_id);
                                setUploadedFiles(prev => 
                                  prev.filter(f => f.file_id !== file.file_id)
                                );
                              } catch (err) {
                                setError('Failed to delete file');
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                            title="Delete file"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                className="rounded-lg bg-gray-600 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                onClick={() => setCurrentStep(1)}
              >
                Previous
              </button>
              <button
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                onClick={handleNext}
                disabled={!validateStep2()}
              >
                Start AI Verification
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Validation */}
        {currentStep === 3 && (
          <div className="rounded-lg bg-[#1b2127] p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              Step 3: AI Validation
            </h3>

            {!verificationRequestId ? (
              <div className="py-8 text-center">
                <button
                  className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSubmitVerification}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Submitting for Verification...
                    </>
                  ) : (
                    "Submit for AI Verification"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  <p className="text-white">
                    Our AI is analyzing your asset submission...
                  </p>
                </div>

                <div className="rounded-lg bg-[#283039] p-4">
                  <p className="text-sm text-gray-300">
                    This process typically takes 1-3 minutes. We're analyzing
                    the submitted documents and validating the asset details
                    using advanced AI fraud detection algorithms.
                  </p>
                </div>

                {verificationStatus && (
                  <div className="rounded-lg border border-green-600 bg-green-900/20 p-4">
                    <p className="mb-2 font-medium text-green-400">
                      ✓ AI Verification Complete!
                    </p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>
                        Fraud Score:{" "}
                        <span
                          className={
                            getRiskIndicator(verificationStatus.fraudScore || 0)
                              .color
                          }
                        >
                          {((verificationStatus.fraudScore || 0) * 100).toFixed(
                            1,
                          )}
                          %
                        </span>
                      </p>
                      <p>
                        Confidence:{" "}
                        {(
                          (verificationStatus.confidenceLevel || 0) * 100
                        ).toFixed(1)}
                        %
                      </p>
                      <p>Status: {verificationStatus.status}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Cross-Chain Confirmation */}
        {currentStep === 4 && verificationStatus && (
          <div className="rounded-lg bg-[#1b2127] p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              Step 4: Verification Complete!
            </h3>

            <div className="space-y-4">
              <div className="rounded-lg border border-green-600 bg-green-900/20 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                    <span className="font-bold text-white">✓</span>
                  </div>
                  <h4 className="text-lg font-bold text-green-400">
                    Asset Verification Complete
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-gray-300">Asset ID:</p>
                    <p className="font-mono text-white">{formData.assetId}</p>
                  </div>
                  <div>
                    <p className="text-gray-300">Verification Request ID:</p>
                    <p className="font-mono text-white">
                      {verificationStatus.requestId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300">Risk Assessment:</p>
                    <p
                      className={
                        getRiskIndicator(verificationStatus.fraudScore || 0)
                          .color
                      }
                    >
                      {
                        getRiskIndicator(verificationStatus.fraudScore || 0)
                          .label
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300">Confidence Level:</p>
                    <p className="text-white">
                      {(
                        (verificationStatus.confidenceLevel || 0) * 100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300">Completed At:</p>
                    <p className="text-white">
                      {verificationStatus.completedAt?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300">Human Review Required:</p>
                    <p
                      className={
                        verificationStatus.humanReviewRequired
                          ? "text-yellow-400"
                          : "text-green-400"
                      }
                    >
                      {verificationStatus.humanReviewRequired ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  View in Dashboard
                </button>
                <button
                  className="rounded-lg bg-gray-600 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                  onClick={() => {
                    setCurrentStep(1);
                    setVerificationRequestId(null);
                    setVerificationStatus(null);
                    setUploadedFiles([]);
                    setFormData({
                      assetId: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      assetType: "other",
                      description: "",
                      value: undefined,
                      location: "",
                      documents: [],
                      metadata: {},
                    });
                  }}
                >
                  Verify Another Asset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssetVerification;
