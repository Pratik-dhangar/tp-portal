import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Upload,
  Building2,
  Calendar,
  MapPin,
  BadgeCheck,
  Clock,
  User,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";
import { Navbar } from "@/components/nav/navbar";
import { useState } from "react";

// Define an extended type for Job that may include skills
interface ExtendedJob extends Job {
  skills?: string;
}

// Define Application type for tracking applied jobs
interface Application {
  id: number;
  jobId: number;
  userId: number;
  status: "pending" | "accepted" | "rejected";
}

export default function Opportunities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<ExtendedJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: jobs, isLoading: jobsLoading } = useQuery<ExtendedJob[]>({
    queryKey: ["/api/jobs"],
  });

  // Fetch user's applications
  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications/user", user?.id],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 10000, // Re-fetch after 10 seconds
  });

  // Check if user has already applied to a job
  const hasApplied = (jobId: number) => {
    if (!applications || !user) return false;
    return applications.some(app => app.jobId === jobId && app.userId === user.id) || false;
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    toast({
      title: "Resume selected",
      description: `Selected: ${file.name}`,
    });
  };

  const handleApply = async (jobId: number) => {
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume before applying",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("jobId", jobId.toString());
    formData.append("resume", resumeFile);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      queryClient.invalidateQueries({ queryKey: ["/api/applications/user"] });
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully",
      });

      // Reset state after successful submission
      setResumeFile(null);
      setSelectedJobId(null);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  const handleViewJob = (job: ExtendedJob) => {
    setSelectedJob(job);
    setDialogOpen(true);
    setSelectedJobId(job.id);
  };

  if (jobsLoading || applicationsLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Detailed Job View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BriefcaseBusiness className="h-6 w-6" />
              {selectedJob?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-5 w-5" />
                <span className="font-medium text-lg">
                  {selectedJob.company}
                </span>
              </div>

              {/* Application Status Badge */}
              {hasApplied(selectedJob.id) && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">
                    You've already applied for this job
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedJob.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <BadgeCheck className="h-4 w-4" />
                  <span>
                    {selectedJob.type === "fulltime"
                      ? "Full Time"
                      : "Internship"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Posted:{" "}
                    {selectedJob.createdAt &&
                      new Date(selectedJob.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Application Status:{" "}
                    {hasApplied(selectedJob.id) ? "Applied" : "Open"}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Job Description</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Requirements</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedJob.requirements}
                </p>
              </div>

              {/* Resume upload and apply button section - only show if not already applied */}
              {!hasApplied(selectedJob.id) && (
                <div className="pt-4 border-t mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="resume-upload" className="block mb-2">
                        Upload Resume (PDF, DOC, DOCX)
                      </Label>
                      <Input
                        id="resume-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                      />
                      {resumeFile && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ {resumeFile.name} selected
                        </p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <Button
                        className="w-full bg-[#9f1c33]"
                        onClick={() => handleApply(selectedJob.id)}
                        disabled={!resumeFile}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Available Opportunities</h2>
        <div className="space-y-4">
          {jobs?.map((job) => (
            <Card
              key={job.id}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {job.title} at {job.company}
                  </div>

                  {/* Show applied badge in card header if already applied */}
                  {hasApplied(job.id) && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Applied
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {job.description.length > 150
                    ? `${job.description.substring(0, 150)}...`
                    : job.description}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {job.createdAt &&
                      new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium">
                    {job.type === "fulltime" ? "Full Time" : "Internship"}
                  </span>
                  <span className="text-sm text-gray-600">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {job.location}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => handleViewJob(job)}>
                  View Job Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
