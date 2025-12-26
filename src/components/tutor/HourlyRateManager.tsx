'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, DollarSign } from 'lucide-react'

interface StudentRate {
    id: string
    studentId: string
    studentName: string
    hourlyRate: number
    subject: string | null
}

interface Student {
    id: string
    name: string
}

export default function HourlyRateManager() {
    const t = useTranslations('HourlyRateManager')
    const [defaultRate, setDefaultRate] = useState<number | null>(null)
    const [currency, setCurrency] = useState('USD')
    const [studentRates, setStudentRates] = useState<StudentRate[]>([])
    const [loading, setLoading] = useState(true)
    const [editingDefault, setEditingDefault] = useState(false)
    const [defaultRateInput, setDefaultRateInput] = useState('')
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [students, setStudents] = useState<Student[]>([])

    // Form state for adding/editing student rates
    const [selectedStudent, setSelectedStudent] = useState('')
    const [studentRateInput, setStudentRateInput] = useState('')
    const [subjectInput, setSubjectInput] = useState('')

    useEffect(() => {
        fetchRates()
        fetchStudents()
    }, [])

    const fetchRates = async () => {
        try {
            const response = await fetch('/api/tutor/rates')
            if (response.ok) {
                const data = await response.json()
                setDefaultRate(data.defaultRate)
                setCurrency(data.currency)
                setStudentRates(data.studentRates)
                setDefaultRateInput(data.defaultRate?.toString() || '')
            } else {
                toast.error(t('messages.error'))
            }
        } catch (error) {
            console.error('Failed to fetch rates:', error)
            toast.error(t('messages.error'))
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async () => {
        try {
            // Fetch tutor's students
            const response = await fetch('/api/tutor/students')
            if (response.ok) {
                const data = await response.json()
                setStudents(data.students || [])
            }
        } catch (error) {
            console.error('Failed to fetch students:', error)
        }
    }

    const handleUpdateDefaultRate = async () => {
        const rate = parseFloat(defaultRateInput)
        if (isNaN(rate) || rate < 0) {
            toast.error('Please enter a valid rate')
            return
        }

        try {
            const response = await fetch('/api/tutor/rates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hourlyRate: rate }),
            })

            if (response.ok) {
                const data = await response.json()
                setDefaultRate(data.rate)
                setEditingDefault(false)
                toast.success(t('messages.rateUpdated'))
            } else {
                toast.error(t('messages.error'))
            }
        } catch (error) {
            console.error('Failed to update default rate:', error)
            toast.error(t('messages.error'))
        }
    }

    const handleAddStudentRate = async () => {
        if (!selectedStudent || !studentRateInput) {
            toast.error('Please select a student and enter a rate')
            return
        }

        const rate = parseFloat(studentRateInput)
        if (isNaN(rate) || rate < 0) {
            toast.error('Please enter a valid rate')
            return
        }

        try {
            const response = await fetch('/api/tutor/rates/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent,
                    hourlyRate: rate,
                    subject: subjectInput || null,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setStudentRates([...studentRates, data.rate])
                setShowAddDialog(false)
                setSelectedStudent('')
                setStudentRateInput('')
                setSubjectInput('')
                toast.success(t('messages.rateAdded'))
            } else {
                const error = await response.json()
                toast.error(error.error || t('messages.error'))
            }
        } catch (error) {
            console.error('Failed to add student rate:', error)
            toast.error(t('messages.error'))
        }
    }

    const handleDeleteStudentRate = async (rateId: string, studentName: string) => {
        if (!confirm(t('studentRates.confirmDelete', { studentName }))) {
            return
        }

        try {
            const response = await fetch(`/api/tutor/rates/student?rateId=${rateId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setStudentRates(studentRates.filter(r => r.id !== rateId))
                toast.success(t('messages.rateDeleted'))
            } else {
                toast.error(t('messages.error'))
            }
        } catch (error) {
            console.error('Failed to delete student rate:', error)
            toast.error(t('messages.error'))
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Default Rate Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        {t('defaultRate.title')}
                    </CardTitle>
                    <CardDescription>{t('defaultRate.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {editingDefault ? (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="defaultRate">{t('form.hourlyRate')}</Label>
                                <div className="flex gap-2 mt-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            {currency === 'USD' ? '$' : currency}
                                        </span>
                                        <Input
                                            id="defaultRate"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={defaultRateInput}
                                            onChange={(e) => setDefaultRateInput(e.target.value)}
                                            className="pl-8"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <Button onClick={handleUpdateDefaultRate}>{t('defaultRate.save')}</Button>
                                    <Button variant="outline" onClick={() => {
                                        setEditingDefault(false)
                                        setDefaultRateInput(defaultRate?.toString() || '')
                                    }}>
                                        {t('defaultRate.cancel')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                {defaultRate ? (
                                    <p className="text-2xl font-bold">
                                        {currency === 'USD' ? '$' : currency}{defaultRate.toFixed(2)}/hour
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">{t('defaultRate.notSet')}</p>
                                )}
                            </div>
                            <Button onClick={() => setEditingDefault(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t('defaultRate.edit')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Student-Specific Rates Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('studentRates.title')}</CardTitle>
                            <CardDescription>{t('studentRates.description')}</CardDescription>
                        </div>
                        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('studentRates.addButton')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t('studentRates.addButton')}</DialogTitle>
                                    <DialogDescription>
                                        Set a custom hourly rate for a specific student
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="student">{t('form.selectStudent')}</Label>
                                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                            <SelectTrigger className="mt-2">
                                                <SelectValue placeholder={t('form.selectStudent')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {students.map((student) => (
                                                    <SelectItem key={student.id} value={student.id}>
                                                        {student.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="studentRate">{t('form.hourlyRate')}</Label>
                                        <div className="relative mt-2">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                {currency === 'USD' ? '$' : currency}
                                            </span>
                                            <Input
                                                id="studentRate"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={studentRateInput}
                                                onChange={(e) => setStudentRateInput(e.target.value)}
                                                className="pl-8"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="subject">{t('form.subject')}</Label>
                                        <Input
                                            id="subject"
                                            value={subjectInput}
                                            onChange={(e) => setSubjectInput(e.target.value)}
                                            placeholder={t('form.allSubjects')}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                        {t('form.cancel')}
                                    </Button>
                                    <Button onClick={handleAddStudentRate}>{t('form.save')}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {studentRates.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">{t('studentRates.noRates')}</p>
                    ) : (
                        <div className="space-y-2">
                            {studentRates.map((rate) => (
                                <div
                                    key={rate.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">{rate.studentName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {rate.subject || t('studentRates.allSubjects')}: {currency === 'USD' ? '$' : currency}
                                            {rate.hourlyRate.toFixed(2)}/hour
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteStudentRate(rate.id, rate.studentName)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
