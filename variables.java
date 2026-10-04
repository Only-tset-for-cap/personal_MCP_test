public class variables {
    @SuppressWarnings("unused")
    public static void main(String[] args) {
        //화면에 글자 출력할떄는 다음과 같은 문법이 사용됨
        System.out.println("Hello worlds!"); //Hello worlds!
        System.out.println(8+5); //13
        System.out.println("8+5"); // 8+5

        //변수 선언법
        //JAVA에서 변수를 선언할 떄에는 다음과 같은 문법이 사용된다.
        int a = 5;
        System.out.println(a); //5

        a = 10;
        System.out.println(a); //10

        //변수 type
        //변수의 type은 [int, long, float, double, char, String] 등이 있다.

        int x = 100; //정수
        double pi = 3.14; //실수
        char ch = 'a'; //단수문자
        String str = "abc"; //복수문자

        System.out.println(x);
        System.out.println(pi);
        System.out.println(ch);
        System.out.println(str); 
        
        //상수
        //상수는 변수와 다르게 constant한 변수로써, 그 값은 변경할 수 없다.
        //상수는 대문자로 짓는 것이 관례.
        
        final int MAX_SPEED; //상수 선언

        MAX_SPEED = 100; //상수에 값 할당
        //MAX_SPEED = 1000; 재할당시 오류 발생

        //리터럴(literal)
        //값(value)를 literal이라고 하며, literal에도 여러 type이 있다.
        //bool형, 실수-정수형, 문자 - 문자열형 등이 있다
        //이때 실수형, 정수형(long)에는 접미사를 붙여서 구분한다.
        //10진수의 경우 접두어를 사용하여 구분한다.

        long big = 100_000_000_000L; //100000000000
        float pi_ = 3.14f; //float형은 접미사 f를 쓴다 (생략 불가)
        double rate = 1.618d; //double형은 접미사 d를 쓴다 (생략가능)
        int octNum = 010; //8진수 10, 10진수로 8
        int hexNum = 0x10; //16진수 10, 10진수로 16

        //지시자(printf)를 통한 출력
        
        int age = 14;
        System.err.printf("age:%d%n",age); // age:14를 출력한 후 줄바꿈

        int year = 2019;
        System.err.printf("age:%d, year:%d%n",age, year); // age:14, year:2019를 출력한 후 줄바꿈

        float f1 = .10f; // 0.10, 1.0e-1
        float f2 = 3.14e3f;
        System.err.printf("f1: %f, %e, %g%n",f1,f1,f1); //f1을 부동소수점/지수형태/소수점일부생략 의 형태로 출력한 후 줄바꿈
        System.err.printf("f2: %f, %e, %g%n", f2,f2,f2);

        

    }
}
