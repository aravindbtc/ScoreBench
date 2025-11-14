
'use client';

import { CriteriaManagement } from "@/components/admin/CriteriaManagement";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { EvaluationCriterion } from "@/lib/types";
import { collection } from "firebase/firestore";
import { Loader2 } from "lucide-react";


export default function ManageCriteriaPage() {
    const firestore = useFirestore();
    const criteriaQuery = useMemoFirebase(() => collection(firestore, 'evaluationCriteria'), [firestore]);
    const { data: criteria, isLoading } = useCollection<EvaluationCriterion>(criteriaQuery);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manage Evaluation Criteria</h1>
            {isLoading ? (
                 <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <CriteriaManagement criteria={criteria || []} />
            )}
        </div>
    )
}
