'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Bell, 
  Calendar, 
  MessageSquare,
  Star,
  Settings,
  Phone,
  Mail,
  Home,
  Building,
  Truck,
  Package,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Send,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DeliveryPreferences {
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening' | 'any';
  deliveryInstructions: string;
  alternatePhone?: string;
  deliveryLocation: 'door' | 'security' | 'neighbor' | 'pickup_point';
  signatureRequired: boolean;
  notificationPreferences: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
}

interface DeliveryFeedback {
  rating: number;
  comment: string;
  deliveryTime: 'on_time' | 'early' | 'late';
  packageCondition: 'excellent' | 'good' | 'damaged';
  deliveryPersonRating: number;
  wouldRecommend: boolean;
}

interface AdvancedTrackingFeaturesProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  className?: string;
}

export function AdvancedTrackingFeatures({
  orderId,
  orderNumber,
  currentStatus,
  className = ''
}: AdvancedTrackingFeaturesProps) {
  const [preferences, setPreferences] = useState<DeliveryPreferences>({
    preferredTimeSlot: 'any',
    deliveryInstructions: '',
    deliveryLocation: 'door',
    signatureRequired: false,
    notificationPreferences: {
      sms: true,
      email: true,
      whatsapp: false,
      push: true
    }
  });

  const [feedback, setFeedback] = useState<DeliveryFeedback>({
    rating: 5,
    comment: '',
    deliveryTime: 'on_time',
    packageCondition: 'excellent',
    deliveryPersonRating: 5,
    wouldRecommend: true
  });

  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem(`delivery_preferences_${orderId}`);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        // Failed to load delivery preferences
      }
    }
  }, [orderId]);

  const savePreferences = async () => {
    setIsSubmitting(true);
    try {
      // Save to localStorage for demo
      localStorage.setItem(`delivery_preferences_${orderId}`, JSON.stringify(preferences));
      
      // In real implementation, save to API
      /*
      const response = await fetch(`/api/orders/${orderId}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      */
      
      toast.success('Delivery preferences saved successfully');
      setIsPreferencesOpen(false);
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    try {
      // Save to localStorage for demo
      localStorage.setItem(`delivery_feedback_${orderId}`, JSON.stringify(feedback));
      
      // In real implementation, submit to API
      /*
      const response = await fetch(`/api/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      */
      
      toast.success('Thank you for your feedback!');
      setHasSubmittedFeedback(true);
      setIsFeedbackOpen(false);
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rescheduleDelivery = () => {
    toast.info('Rescheduling functionality coming soon');
  };

  const contactDeliveryPartner = () => {
    toast.info('Connecting you with delivery partner...');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Delivery Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-16 flex-col gap-1">
                  <Settings className="w-5 h-5" />
                  <span className="text-xs">Preferences</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Delivery Preferences</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Time Slot */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Preferred Time Slot</Label>
                    <RadioGroup
                      value={preferences.preferredTimeSlot}
                      onValueChange={(value) => 
                        setPreferences(prev => ({ ...prev, preferredTimeSlot: value as any }))
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="morning" id="morning" />
                        <Label htmlFor="morning">Morning (9 AM - 12 PM)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="afternoon" id="afternoon" />
                        <Label htmlFor="afternoon">Afternoon (12 PM - 6 PM)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="evening" id="evening" />
                        <Label htmlFor="evening">Evening (6 PM - 9 PM)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="any" id="any" />
                        <Label htmlFor="any">Any Time</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Delivery Location */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Delivery Location</Label>
                    <Select
                      value={preferences.deliveryLocation}
                      onValueChange={(value) => 
                        setPreferences(prev => ({ ...prev, deliveryLocation: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="door">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Front Door
                          </div>
                        </SelectItem>
                        <SelectItem value="security">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Security/Reception
                          </div>
                        </SelectItem>
                        <SelectItem value="neighbor">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Trusted Neighbor
                          </div>
                        </SelectItem>
                        <SelectItem value="pickup_point">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Pickup Point
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delivery Instructions */}
                  <div className="space-y-3">
                    <Label htmlFor="instructions" className="text-base font-medium">
                      Special Instructions
                    </Label>
                    <Textarea
                      id="instructions"
                      placeholder="e.g., Leave at front door, Ring doorbell twice, etc."
                      value={preferences.deliveryInstructions}
                      onChange={(e) => 
                        setPreferences(prev => ({ ...prev, deliveryInstructions: e.target.value }))
                      }
                      className="min-h-20"
                    />
                  </div>

                  {/* Alternate Phone */}
                  <div className="space-y-3">
                    <Label htmlFor="altPhone" className="text-base font-medium">
                      Alternate Phone Number
                    </Label>
                    <Input
                      id="altPhone"
                      placeholder="+91 9876543210"
                      value={preferences.alternatePhone || ''}
                      onChange={(e) => 
                        setPreferences(prev => ({ ...prev, alternatePhone: e.target.value }))
                      }
                    />
                  </div>

                  {/* Signature Required */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Signature Required</Label>
                      <p className="text-sm text-gray-500">Require signature for delivery</p>
                    </div>
                    <Switch
                      checked={preferences.signatureRequired}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, signatureRequired: checked }))
                      }
                    />
                  </div>

                  {/* Notification Preferences */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Notification Preferences</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>SMS Notifications</span>
                        </div>
                        <Switch
                          checked={preferences.notificationPreferences.sms}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({
                              ...prev,
                              notificationPreferences: { ...prev.notificationPreferences, sms: checked }
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>Email Notifications</span>
                        </div>
                        <Switch
                          checked={preferences.notificationPreferences.email}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({
                              ...prev,
                              notificationPreferences: { ...prev.notificationPreferences, email: checked }
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>WhatsApp Notifications</span>
                        </div>
                        <Switch
                          checked={preferences.notificationPreferences.whatsapp}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({
                              ...prev,
                              notificationPreferences: { ...prev.notificationPreferences, whatsapp: checked }
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span>Push Notifications</span>
                        </div>
                        <Switch
                          checked={preferences.notificationPreferences.push}
                          onCheckedChange={(checked) =>
                            setPreferences(prev => ({
                              ...prev,
                              notificationPreferences: { ...prev.notificationPreferences, push: checked }
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsPreferencesOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={savePreferences}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {['pending', 'confirmed', 'shipped'].includes(currentStatus) && (
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={rescheduleDelivery}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs">Reschedule</span>
              </Button>
            )}

            <Button
              variant="outline"
              className="h-16 flex-col gap-1"
              onClick={contactDeliveryPartner}
            >
              <Phone className="w-5 h-5" />
              <span className="text-xs">Contact</span>
            </Button>

            {currentStatus === 'delivered' && !hasSubmittedFeedback && (
              <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-16 flex-col gap-1">
                    <Star className="w-5 h-5" />
                    <span className="text-xs">Review</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Rate Your Delivery Experience</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Overall Rating */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Overall Experience</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                          >
                            <Star
                              className={`w-6 h-6 ${
                                rating <= feedback.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Time */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Delivery Time</Label>
                      <Select
                        value={feedback.deliveryTime}
                        onValueChange={(value) => 
                          setFeedback(prev => ({ ...prev, deliveryTime: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="early">Earlier than expected</SelectItem>
                          <SelectItem value="on_time">Right on time</SelectItem>
                          <SelectItem value="late">Later than expected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Package Condition */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Package Condition</Label>
                      <Select
                        value={feedback.packageCondition}
                        onValueChange={(value) => 
                          setFeedback(prev => ({ ...prev, packageCondition: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent - Perfect condition</SelectItem>
                          <SelectItem value="good">Good - Minor wear</SelectItem>
                          <SelectItem value="damaged">Damaged - Visible damage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delivery Person Rating */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Delivery Person</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={() => setFeedback(prev => ({ ...prev, deliveryPersonRating: rating }))}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                rating <= feedback.deliveryPersonRating
                                  ? 'fill-blue-400 text-blue-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Would Recommend */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Would you recommend our service?</Label>
                      <div className="flex gap-3">
                        <Button
                          variant={feedback.wouldRecommend ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: true }))}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Yes
                        </Button>
                        <Button
                          variant={!feedback.wouldRecommend ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: false }))}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          No
                        </Button>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                      <Label htmlFor="comment" className="text-base font-medium">
                        Additional Comments
                      </Label>
                      <Textarea
                        id="comment"
                        placeholder="Tell us about your experience..."
                        value={feedback.comment}
                        onChange={(e) => 
                          setFeedback(prev => ({ ...prev, comment: e.target.value }))
                        }
                        className="min-h-20"
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsFeedbackOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={submitFeedback}
                        disabled={isSubmitting}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {hasSubmittedFeedback && (
              <Button variant="outline" className="h-16 flex-col gap-1" disabled>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-xs">Reviewed</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Preferences Summary */}
      {preferences.deliveryInstructions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Delivery Instructions</h4>
                <p className="text-sm text-gray-600 mt-1">{preferences.deliveryInstructions}</p>
                {preferences.preferredTimeSlot !== 'any' && (
                  <Badge variant="outline" className="mt-2">
                    <Clock className="w-3 h-3 mr-1" />
                    {preferences.preferredTimeSlot === 'morning' && 'Morning (9 AM - 12 PM)'}
                    {preferences.preferredTimeSlot === 'afternoon' && 'Afternoon (12 PM - 6 PM)'}
                    {preferences.preferredTimeSlot === 'evening' && 'Evening (6 PM - 9 PM)'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mock GPS Tracking */}
      {currentStatus === 'shipped' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Live GPS Tracking
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Location:</span>
                <span className="text-sm">Mumbai Central Hub</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Distance Remaining:</span>
                <span className="text-sm">23 km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estimated Arrival:</span>
                <span className="text-sm font-medium text-green-600">2:30 PM - 3:30 PM</span>
              </div>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Interactive GPS map</p>
                  <p className="text-xs">Real-time location tracking</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}