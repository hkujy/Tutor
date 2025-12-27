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
import { Pencil, Trash2, Plus, DollarSign, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

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

    const handleUpdateCurrency = async (newCurrency: string) => {
        try {
            const response = await fetch('/api/tutor/rates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currency: newCurrency }),
            })

            if (response.ok) {
                setCurrency(newCurrency)
                toast.success('Currency updated successfully')
            } else {
                toast.error(t('messages.error'))
            }
        } catch (error) {
            console.error('Failed to update currency:', error)
            toast.error(t('messages.error'))
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
        <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-0">
            {/* Header section with some flare */}
            <div className="flex flex-col gap-2 mb-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t('title')}</h1>
                <p className="text-muted-foreground">{t('defaultRate.description')}</p>
            </div>

            {/* Default Rate & Currency Card */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-background to-indigo-50/10 dark:to-indigo-950/10 transition-all hover:shadow-2xl">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            {t('defaultRate.title')}
                        </CardTitle>
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border text-sm font-medium">
                            <Globe className="h-4 w-4" />
                            {currency}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Settings Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('labels.baseCurrency')}
                            </Label>
                            <Select value={currency} onValueChange={handleUpdateCurrency}>
                                <SelectTrigger className="w-full h-12 text-lg font-medium transition-all hover:border-indigo-400 ring-offset-background focus:ring-2 focus:ring-indigo-500">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD" className="py-3">USD ($) - US Dollar</SelectItem>
                                    <SelectItem value="CNY" className="py-3">CNY (¥) - Chinese Yuan</SelectItem>
                                    <SelectItem value="GBP" className="py-3">GBP (£) - British Pound</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground italic">
                                Changing base currency updates all future bookings.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('defaultRate.title')}
                            </Label>
                            {editingDefault ? (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : '£'}
                                        </span>
                                        <Input
                                            id="defaultRate"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={defaultRateInput}
                                            onChange={(e) => setDefaultRateInput(e.target.value)}
                                            className="pl-12 h-12 text-xl font-bold rounded-lg border-2 border-indigo-200 focus:border-indigo-500 transition-all"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button onClick={handleUpdateDefaultRate} className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-6 px-4">
                                            {t('defaultRate.save')}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setEditingDefault(false)
                                            setDefaultRateInput(defaultRate?.toString() || '')
                                        }} className="text-xs">
                                            {t('defaultRate.cancel')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800">
                                    <div>
                                        {defaultRate ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-foreground">
                                                    {formatCurrency(defaultRate, currency)}
                                                </span>
                                                <span className="text-muted-foreground font-medium">/hour</span>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">{t('defaultRate.notSet')}</p>
                                        )}
                                    </div>
                                    <Button onClick={() => setEditingDefault(true)} variant="outline" className="rounded-xl border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                        <Pencil className="h-4 w-4 mr-2" />
                                        {t('defaultRate.edit')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student-Specific Rates Card */}
            <Card className="border-none shadow-lg overflow-hidden transition-all hover:shadow-xl">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Plus className="h-5 w-5 text-indigo-500" />
                                {t('studentRates.title')}
                            </CardTitle>
                            <CardDescription className="mt-1">{t('studentRates.description')}</CardDescription>
                        </div>
                        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                            <DialogTrigger asChild>
                                <Button className="bg-foreground text-background hover:opacity-90 transition-all rounded-full px-6">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('studentRates.addButton')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                                <DialogHeader className="p-6 bg-indigo-600 text-white">
                                    <DialogTitle className="text-2xl font-bold">{t('studentRates.addButton')}</DialogTitle>
                                    <DialogDescription className="text-indigo-100">
                                        Customize pricing for specific students or learning stages.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 p-8">
                                    <div className="space-y-2">
                                        <Label htmlFor="student" className="font-semibold text-foreground">{t('form.selectStudent')}</Label>
                                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                            <SelectTrigger className="mt-1 h-11 border-2 ring-offset-background focus:ring-2 focus:ring-indigo-500">
                                                <SelectValue placeholder={t('form.selectStudent')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {students.map((student) => (
                                                    <SelectItem key={student.id} value={student.id} className="py-2">
                                                        {student.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="studentRate" className="font-semibold text-foreground">{t('form.hourlyRate')}</Label>
                                        <div className="relative mt-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-600">
                                                {currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : '£'}
                                            </span>
                                            <Input
                                                id="studentRate"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={studentRateInput}
                                                onChange={(e) => setStudentRateInput(e.target.value)}
                                                className="pl-10 h-11 border-2 transition-all focus:border-indigo-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="font-semibold text-foreground">{t('form.subject')}</Label>
                                        <Input
                                            id="subject"
                                            value={subjectInput}
                                            onChange={(e) => setSubjectInput(e.target.value)}
                                            placeholder="e.g. Mathematics - Advanced Level"
                                            className="h-11 border-2 transition-all focus:border-indigo-500"
                                        />
                                        <p className="text-xs text-muted-foreground italic">
                                            Supports specific subjects or levels (e.g., "Beginner Piano").
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 bg-muted/30 gap-2 sm:gap-0">
                                    <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="rounded-xl px-6">
                                        {t('form.cancel')}
                                    </Button>
                                    <Button onClick={handleAddStudentRate} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-200 dark:shadow-none">
                                        {t('form.save')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {studentRates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <div className="p-4 bg-muted/50 rounded-full mb-4">
                                    <Globe className="h-8 w-8 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">{t('studentRates.noRates')}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Custom rates for specific students will appear here.
                                </p>
                            </div>
                        ) : (
                            studentRates.map((rate) => (
                                <div
                                    key={rate.id}
                                    className="group flex items-center justify-between p-6 hover:bg-muted/50 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                                            {rate.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-foreground group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                {rate.studentName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="bg-muted text-xs font-semibold px-2 py-0 border-none rounded-md">
                                                    {rate.subject || t('studentRates.allSubjects')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-foreground">
                                                {formatCurrency(rate.hourlyRate, currency)}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">/ hour</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteStudentRate(rate.id, rate.studentName)}
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-xl"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
