
'use client';

import { CriteriaManagement } from "@/components/admin/CriteriaManagement";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { EvaluationCriterion } from "@/lib/types";
import { collection } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEvent } from "@/hooks/use-event";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function ManageCriteriaPage() {
    const firestore = useFirestore();
    const { eventId, isEventLoading } = useEvent();
    const router = useRouter();

    useEffect(() => {
        if (!isEventLoading && !eventId) {
            router.push('/admin/events');
        }
    }, [eventId, isEventLoading, router]);
    
    const criteriaQuery = useMemoFirebase(() => {
        if (!eventId) return null;
        return collection(firestore, `events/${eventId}/evaluationCriteria`);
    }, [firestore, eventId]);
    const { data: criteria, isLoading } = useCollection<EvaluationCriterion>(criteriaQuery);

    const fullPageLoader = isEventLoading || (isLoading && !criteria);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manage Evaluation Criteria</h1>
            {fullPageLoader ? (
                 <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <CriteriaManagement criteria={criteria || []} />
            )}
        </div>
    )
}
