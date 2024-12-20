import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Mic, MicOff } from "lucide-react";

interface FormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  occupation: string;
  gender: string;
  postalCode: string;
  address: string;
  addressKana: string;
  phoneNumber: string;
}

export function InsuranceFormWithSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isEnglish, setIsEnglish] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    birthYear: "04",
    birthMonth: "01",
    birthDay: "01",
    occupation: "other",
    gender: "male",
    postalCode: "",
    address: "",
    addressKana: "",
    phoneNumber: "",
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = isEnglish ? "en-US" : "ja-JP";

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        processTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);

        setIsListening(false);
      };
    } else {
      console.error("Speech recognition not supported");
    }
  }, [isEnglish]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const test = () => {
    const transcript = prompt("郵便番号は4324243");
    if (transcript !== null) {
      setTranscript(transcript);
      processTranscript(transcript);
    } else {
      setTranscript(""); // Set to an empty string if prompt is cancelled
    }
  };

  const processTranscript = (transcript: string) => {
    // Simple logic to fill form fields based on speech input
    if (isEnglish) {
      if (transcript.toLocaleLowerCase().includes("name")) {
        const match = transcript.toLocaleLowerCase().match(/name(.+)/);
        if (match) setFormData((prev) => ({ ...prev, lastName: match[1] }));
      }
      if (transcript.toLowerCase().includes("address")) {
        const match = transcript.toLowerCase().match(/address\sis(.+)/);
        if (match) setFormData((prev) => ({ ...prev, address: match[1] }));
      }
      if (transcript.toLowerCase().includes("phone number")) {
        const match = transcript.toLowerCase().match(/phone\snumber\sis(.+)/);
        if (match) {
          const phoneNumber = match[1].replace(/[^\d-]/g, "");
          setFormData((prev) => ({ ...prev, phoneNumber }));
        }
      }
    } else {
      const nameMatch = transcript.match(/名前は(.+)/);
      if (nameMatch) {
        const fullName = nameMatch[1];
        if (fullName.length >= 2) {
          setFormData((prev) => ({
            ...prev,
            lastName: fullName,
            //firstName: fullName.slice(1).join(" "),
          }));
        }
      }

      // Name in Kana
      const kanaMatch = transcript.match(/カナは(.+)/);
      if (kanaMatch) {
        const fullKana = kanaMatch[1].replace(/\s+/g, "");
        setFormData((prev) => ({
          ...prev,
          lastNameKana: fullKana.slice(0, fullKana.length / 2),
          firstNameKana: fullKana.slice(fullKana.length / 2),
        }));
      }

      // Gender
      if (transcript.includes("性別は男性")) {
        setFormData((prev) => ({ ...prev, gender: "male" }));
      } else if (transcript.includes("性別は女性")) {
        setFormData((prev) => ({ ...prev, gender: "female" }));
      }

      // Postal Code
      const postalMatch = transcript.match(/郵便番号は(.+)/);
      if (postalMatch) {
        const postalCode: any = postalMatch[1].replace(
          /[.,\/#!$%\^&\*;:{}=\-_`~()。]/g,
          "",
        );
        if (postalCode != null) {
          setFormData((prev) => ({
            ...prev,
            postalCode: postalCode.match(/\d+/)[0],
          }));
        }
      }

      // Address
      const addressMatch = transcript.match(/住所は(.+)/);
      if (addressMatch) {
        setFormData((prev) => ({
          ...prev,
          address: addressMatch[1]
            .split("、")[0]
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。、]/g, "")
            .replaceAll("の", "-"),
        }));
      }

      // Phone Number
      const phoneMatch = transcript.match(/電話番号は([\d-]+)/);
      if (phoneMatch) {
        setFormData((prev) => ({ ...prev, phoneNumber: phoneMatch[1] }));
      }

      // Occupation
      if (transcript.includes("職業は会社員")) {
        setFormData((prev) => ({ ...prev, occupation: "employee" }));
      } else if (transcript.includes("職業は自営業")) {
        setFormData((prev) => ({ ...prev, occupation: "self-employed" }));
      } else if (transcript.includes("職業はその他")) {
        setFormData((prev) => ({ ...prev, occupation: "other" }));
      }

      // Birth Date
      const birthMatch = transcript.match(/生年月日は(.+)/);
      if (birthMatch) {
        //const [, era, year, month, day] = birthMatch;
        setFormData((prev) => ({
          ...prev,
          birthDay: birthMatch[1]
            .split("。")[0]
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()、]。/g, ""),
        }));
        // You might want to add logic here to convert the Japanese era year to the Gregorian calendar year
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <Tabs defaultValue="insured" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12">
            <TabsTrigger
              value="contractor"
              className="data-[state=active]:bg-orange-100"
            >
              契約者
            </TabsTrigger>
            <TabsTrigger
              value="insured"
              className="data-[state=active]:bg-orange-100"
            >
              被保険者
            </TabsTrigger>
            <TabsTrigger
              value="beneficiary"
              className="data-[state=active]:bg-orange-100"
            >
              受取人
            </TabsTrigger>
          </TabsList>
          <TabsContent value="insured" className="mt-6">
            <form className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">申込書情報入力</h2>

                <Button
                  type="button"
                  onClick={toggleListening}
                  variant={isListening ? "destructive" : "default"}
                  className="flex items-center gap-2"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {isListening ? "音声入力停止" : "音声入力開始"}
                </Button>
              </div>
              {isListening && (
                <div className="bg-muted p-2 rounded">
                  音声認識中: {transcript}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      被保者名
                      <span className="text-orange-500 ml-1">(必須)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="姓名"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                      />
                      <Input
                        className="hidden"
                        placeholder="名"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                      />
                      <span className="self-center">様</span>
                    </div>
                  </div>
                  <div className="space-y-2 invisible">
                    <Label>
                      被保険者名（全角カナ）
                      <span className="text-orange-500 ml-1">(必須)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="セイ"
                        value={formData.lastNameKana}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lastNameKana: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="メイ"
                        value={formData.firstNameKana}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            firstNameKana: e.target.value,
                          }))
                        }
                      />
                      <span className="self-center">様</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>生年月日</Label>
                    <div className="flex gap-2">
                      <Select defaultValue="heisei">
                        <SelectTrigger className="w-24 hidden">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heisei">平成</SelectItem>
                          <SelectItem value="showa">昭和</SelectItem>
                          <SelectItem value="reiwa">令和</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20 hidden"
                        value={formData.birthYear}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            birthYear: e.target.value,
                          }))
                        }
                      />

                      <Input
                        type="number"
                        className="w-20 hidden"
                        value={formData.birthMonth}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            birthMonth: e.target.value,
                          }))
                        }
                      />

                      <Input
                        value={formData.birthDay}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            birthDay: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>職業</Label>
                    <Select
                      value={formData.occupation}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, occupation: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="other">その他有職者</SelectItem>
                        <SelectItem value="employee">会社員</SelectItem>
                        <SelectItem value="self-employed">自営業</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>性別</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, gender: value }))
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">男性</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">女性</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>
                      郵便番号（半角数字）
                      <span className="text-orange-500 ml-1">(必須)</span>
                    </Label>
                    <Checkbox id="same-address" />
                    <Label htmlFor="same-address" className="text-sm">
                      契約者住所と同一
                    </Label>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span>〒</span>
                    <Input
                      className="w-32"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          postalCode: e.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="secondary"
                      className="bg-orange-100 hover:bg-orange-200"
                    >
                      住所検索
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    住所（漢字）
                    <span className="text-orange-500 ml-1">(必須)</span>
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 hidden">
                  <Label>
                    住所（全角カナ）
                    <span className="text-orange-500 ml-1">(必須)</span>
                  </Label>
                  <Input
                    value={formData.addressKana}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addressKana: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>電話番号（半角数字・ハイフン要）</Label>
                  <Input
                    placeholder="例）090-0000-0000"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="secondary"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                >
                  モバイル・ペーパーレス手続きへ
                </Button>
                <div className="space-x-2">
                  English
                  <Checkbox
                    onClick={() => {
                      setIsEnglish(!isEnglish);
                      console.log(isEnglish);
                    }}
                  ></Checkbox>
                  <Button variant="outline">キャンセル</Button>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    保存
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <Button
        className="bg-white-100"
        onClick={() => {
          test();
        }}
      >
        Test
      </Button>
    </Card>
  );
}
