'use client'

import React, { useState, useEffect } from 'react'
import CryptoJS from 'crypto-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, Eye, EyeOff } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface EncryptedLink {
  id: number
  encrypted_title: string
  encrypted_url: string
}

export default function EncryptedLinkSaver() {
  const [links, setLinks] = useState<EncryptedLink[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newLink, setNewLink] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [isPasswordSet, setIsPasswordSet] = useState(false)
  const [decryptedLinks, setDecryptedLinks] = useState<{ id: number; title: string; url: string }[]>([])
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [visibleLinkId, setVisibleLinkId] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links')
      if (!response.ok) {
        throw new Error('Failed to fetch links')
      }
      const data = await response.json()
      setLinks(data)
    } catch (error) {
      console.error('Error fetching links:', error)
      toast({
        title: "Error",
        description: "Failed to fetch links from server.",
        variant: "destructive",
      })
    }
  }

  const saveLinks = async (updatedLinks: EncryptedLink[]) => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLinks),
      })
      if (!response.ok) {
        throw new Error('Failed to save links')
      }
      toast({
        title: "Success",
        description: "Links saved successfully.",
      })
    } catch (error) {
      console.error('Error saving links:', error)
      toast({
        title: "Error",
        description: "Failed to save links to server.",
        variant: "destructive",
      })
    }
  }

  const encrypt = (text: string) => {
    return CryptoJS.AES.encrypt(text, masterPassword).toString()
  }

  const decrypt = (ciphertext: string) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, masterPassword)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (masterPassword) {
      setIsPasswordSet(true)
      setIsModalOpen(false)
      decryptAllLinks()
    }
  }

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newLink.trim() && masterPassword) { // Añadir trim para evitar solo espacios
      const newId = Date.now();
      const encrypted_title = encrypt(newTitle);
      const encrypted_url = encrypt(newLink);
  
      // Asegúrate de que el proceso de encriptación no retorna valores vacíos
      if (!encrypted_title || !encrypted_url) {
        console.error('Error encrypting title or URL.');
        return;
      }
  
      const updatedLinks = [...links, { id: newId, encrypted_title, encrypted_url }];
      setLinks(updatedLinks);
      saveLinks(updatedLinks);
      setNewTitle('');
      setNewLink('');
      decryptAllLinks();
    } else {
      console.error('Title, URL, or master password is missing.');
    }
  }  

  const decryptAllLinks = () => {
    const decrypted = links.map(link => {
      try {
        return {
          id: link.id,
          title: decrypt(link.encrypted_title),
          url: decrypt(link.encrypted_url)
        }
      } catch {
        return { id: link.id, title: 'Decryption failed', url: 'Decryption failed' }
      }
    })
    setDecryptedLinks(decrypted)
  }

  const handleDeleteLink = (id: number) => {
    const updatedLinks = links.filter(link => link.id !== id)
    setLinks(updatedLinks)
    saveLinks(updatedLinks)
    setDecryptedLinks(decryptedLinks.filter(link => link.id !== id))
  }

  const toggleLinkVisibility = (id: number) => {
    setVisibleLinkId(visibleLinkId === id ? null : id)
  }

  const handleLogout = () => {
    setMasterPassword('')
    setIsPasswordSet(false)
    setDecryptedLinks([])
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Master Password</DialogTitle>
            <DialogDescription>
              This password will be used to encrypt and decrypt your links.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetPassword}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="masterPassword" className="text-right">
                  Password
                </Label>
                <Input
                  id="masterPassword"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Set Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isPasswordSet && (
        <div className="max-w-md mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Encrypted Link Saver</CardTitle>
              <CardDescription>Save your links securely with encryption</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <Label htmlFor="newTitle">Title</Label>
                  <Input
                    id="newTitle"
                    type="text"
                    placeholder="My Favorite Site"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newLink">Link</Label>
                  <Input
                    id="newLink"
                    type="url"
                    placeholder="https://example.com"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Add Encrypted Link</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Links</CardTitle>
              <CardDescription>Your saved links</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {decryptedLinks.map((link) => (
                  <li key={link.id} className="flex items-center justify-between space-x-2">
                    <div className="flex-grow">
                      <h3 className="font-medium">{link.title}</h3>
                      {visibleLinkId === link.id && (
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {link.url}
                        </a>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => toggleLinkVisibility(link.id)}
                        aria-label={visibleLinkId === link.id ? "Hide link" : "Show link"}
                      >
                        {visibleLinkId === link.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the link.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLink(link.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Button onClick={handleLogout} className="w-full">Logout</Button>
        </div>
      )}
    </div>
  )
}